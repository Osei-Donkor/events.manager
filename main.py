from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session

# -------------------------
# DATABASE CONNECTION
# -------------------------
DATABASE_URL = "mysql+mysqlconnector://root:password@localhost:3306/eventdb"
# change "root", "password", "eventdb" to your MySQL username, password, and database name

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# -------------------------
# DATABASE MODELS
# -------------------------
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False)  # "organizer" or "attendee"

    events = relationship("Event", back_populates="organizer")

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    organizer_id = Column(Integer, ForeignKey("users.id"))

    organizer = relationship("User", back_populates="events")
    registrations = relationship("Registration", back_populates="event")

class Registration(Base):
    __tablename__ = "registrations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    event_id = Column(Integer, ForeignKey("events.id"))

    event = relationship("Event", back_populates="registrations")

# Create tables in database
Base.metadata.create_all(bind=engine)

# -------------------------
# SCHEMAS
# -------------------------
class UserSignup(BaseModel):
    username: str
    password: str
    role: str

class UserLogin(BaseModel):
    username: str
    password: str

class EventSchema(BaseModel):
    id: int
    name: str
    organizer_id: int

class RegisterSchema(BaseModel):
    user_id: int
    event_id: int

# -------------------------
# FASTAPI APP
# -------------------------
app = FastAPI()

# Dependency: get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------
# ROUTES
# -------------------------
@app.post("/signup")
def signup(user: UserSignup, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = User(username=user.username, password=user.password, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"msg": "User created successfully", "user_id": new_user.id}

@app.post("/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username, User.password == data.password).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"id": user.id, "username": user.username, "role": user.role}

@app.post("/events")
def create_event(event: EventSchema, db: Session = Depends(get_db)):
    organizer = db.query(User).filter(User.id == event.organizer_id, User.role == "organizer").first()
    if not organizer:
        raise HTTPException(status_code=403, detail="Only organizers can create events")

    new_event = Event(id=event.id, name=event.name, organizer_id=event.organizer_id)
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return {"msg": "Event created", "event_id": new_event.id}

@app.get("/events")
def get_events(db: Session = Depends(get_db)):
    events = db.query(Event).all()
    return [{"id": ev.id, "name": ev.name, "organizer_id": ev.organizer_id} for ev in events]

@app.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return {"msg": "Event deleted"}

@app.post("/register")
def register_event(reg: RegisterSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == reg.user_id).first()
    event = db.query(Event).filter(Event.id == reg.event_id).first()

    if not user or not event:
        raise HTTPException(status_code=404, detail="User or Event not found")

    new_reg = Registration(user_id=reg.user_id, event_id=reg.event_id)
    db.add(new_reg)
    db.commit()
    return {"msg": "Registered successfully"}
