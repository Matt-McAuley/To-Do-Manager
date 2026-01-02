from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()

class Project(db.Model):
  """
  Project Model
  """

  id = db.Column(db.Integer, autoincrement=True, primary_key=True)
  title = db.Column(db.String, nullable=False)
  todos = db.relationship("Todo", cascade="delete")
  user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

  def __init__(self, **kwargs):
    """
    Create a project object
    """
    __tablename__ = "project"
    self.title = kwargs.get("title", "")
    self.user_id = kwargs.get("user_id", 0)

  def serialize(self):
    """
    Serialize a project object
    """
    return {
      "id": self.id,
      "title": self.title,
      "todos": [t.simple_serialize() for t in self.todos],
      "user_id": self.user_id
    }

class Todo(db.Model):
  """
  Todo Model
  """

  id = db.Column(db.Integer, primary_key=True, autoincrement=True)
  title = db.Column(db.String, nullable=False)
  description = db.Column(db.String, nullable=False)
  due_date = db.Column(db.Integer, nullable=False)
  priority= db.Column(db.String, nullable=False)
  project_id = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False)
  user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
  is_completed = db.Column(db.Boolean, default=False, nullable=False)
  completed_at = db.Column(db.Integer, nullable=True)

  def __init__(self, **kwargs):
    """
    Create a todo object
    """
    __tablename__ = "todo"
    self.title = kwargs.get("title", "")
    self.description = kwargs.get("description", "")
    self.due_date = kwargs.get("due_date", 0)
    self.priority = kwargs.get("priority", "")
    self.project_id = kwargs.get("project_id", 0)
    self.user_id = kwargs.get("user_id", 0)
    self.is_completed = kwargs.get("is_completed", False)
    self.completed_at = kwargs.get("completed_at", None)

  def serialize(self):
    """
    Serialize a todo object
    """
    return {
      "id": self.id,
      "title": self.title,
      "description": self.description,
      "due_date": self.due_date,
      "priority": self.priority,
      "project_id": self.project_id,
      "user_id": self.user_id,
      "is_completed": self.is_completed,
      "completed_at": self.completed_at
    }
  
  def simple_serialize(self):
    """
    Serialize a todo object without project field
    """
    return {
      "id": self.id,
      "title": self.title,
      "description": self.description,
      "due_date": self.due_date,
      "priority": self.priority,
      "user_id": self.user_id,
      "is_completed": self.is_completed,
      "completed_at": self.completed_at
    }


class User(db.Model):
  """
  User Model
  """

  id = db.Column(db.Integer, autoincrement=True, primary_key=True)
  email = db.Column(db.String, nullable=False, unique=True)
  password = db.Column(db.String, nullable=False)
  is_verified = db.Column(db.Boolean, default=False, nullable=False)
  verification_token = db.Column(db.String, nullable=True)

  def __init__(self, **kwargs):
    """
    Create a user object
    """
    __tablename__ = "user"
    self.email = kwargs.get("email", "")
    self.password = kwargs.get("password", "")
    self.is_verified = kwargs.get("is_verified", False)
    self.verification_token = kwargs.get("verification_token", None)

  def serialize(self):
    return {
      "id": self.id,
      "email": self.email,
      "is_verified": self.is_verified,
    }