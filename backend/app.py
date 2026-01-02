import secrets
import time
import atexit
from apscheduler.schedulers.background import BackgroundScheduler
from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import json
from db import *
import bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, set_access_cookies, \
  unset_jwt_cookies
import os
from dotenv import load_dotenv
from email_service import send_verification_email

load_dotenv()

app = Flask(__name__, static_folder="../dist/assets", template_folder="../dist")
CORS(app, supports_credentials=True)
db_filename = "todo.db"

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///%s" % db_filename
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ECHO"] = True
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")
app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['JWT_ACCESS_COOKIE_PATH'] = '/'
app.config['JWT_COOKIE_CSRF_PROTECT'] = False

jwt = JWTManager(app)

db.init_app(app)
with app.app_context():
  db.create_all()

def success_response(data, code=200):
  return json.dumps(data), code

def failure_response(message, code=404):
  return json.dumps({"error": message}), code

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
  return render_template("index.html")

# API
@app.route('/api/projects/', methods=["GET"])
@jwt_required()
def get_all_projects():
  """
  Route for getting all projects
  """
  current_user = get_jwt_identity()
  return success_response({"projects": [p.serialize() for p in Project.query.filter_by(user_id=current_user).all()]})

@app.route('/api/projects/', methods=["POST"])
@jwt_required()
def create_project():
  """
  Route for creating a project
  """
  current_user = get_jwt_identity()
  print('current_user')
  print(current_user)
  body = json.loads(request.data)
  title = body.get("title")
  todos = body.get("todos")
  if title is None or todos is None:
    return failure_response("Incorrect formatting!")
  project = Project(title=title, user_id=current_user)
  db.session.add(project)
  db.session.commit()
  for todo in todos:
    new_todo = Todo(
      id=todo.get("id"),
      title=todo.get("title"), 
      description=todo.get("description"),
      due_date=todo.get("due_date"),
      priority=todo.get("priority"),
      project_id = project.id,
      user_id = current_user
      )
    db.session.add(new_todo)
  db.session.commit()
  return success_response(project.serialize(), 201)

@app.route('/api/projects/<int:project_id>/', methods=["GET"])
@jwt_required()
def get_todos(project_id):
  """
  Route for getting a specific project
  """
  current_user = get_jwt_identity()
  project = Project.query.filter_by(id=project_id, user_id=current_user).first()
  if project is None:
    return failure_response("Couldn't find project!")
  return success_response(project.serialize())

@app.route('/api/projects/<int:project_id>/', methods=["DELETE"])
@jwt_required()
def delete_project(project_id):
  """
  Route for deleting a specific project
  """
  current_user = get_jwt_identity()
  project = Project.query.filter_by(id=project_id, user_id=current_user).first()
  if project is None:
    return failure_response("Couldn't find project!")
  db.session.delete(project)
  db.session.commit()
  return success_response(project.serialize())

@app.route('/api/projects/<int:project_id>/', methods=["POST"])
@jwt_required()
def update_project(project_id):
  """
  Route for updating a specific project
  """
  current_user = get_jwt_identity()
  body = json.loads(request.data)
  title = body.get("title")
  if title is None :
    return failure_response("Incorrect formatting!")
  project = Project.query.filter_by(id=project_id, user_id=current_user).first()
  if project is None:
    return failure_response("Couldn't find project!")
  project.title = title
  db.session.commit()
  return success_response(project.serialize())

@app.route('/api/projects/<int:project_id>/todo/', methods=["POST"])
@jwt_required()
def add_todo(project_id):
  """
  Route for adding a todo to a project
  """
  current_user = get_jwt_identity()
  project = Project.query.filter_by(id=project_id, user_id=current_user).first()
  if project is None:
    return failure_response("Couldn't find project!")
  body = json.loads(request.data)
  title = body.get("title")
  description = body.get("description")
  priority = body.get("priority")
  due_date = body.get("due_date")
  if title is None or description is None or priority is None or due_date is None:
    return failure_response("Incorrect formatting for todo!")
  todo = Todo(title=title, description=description, priority=priority, due_date=due_date, project_id=project_id, user_id=current_user)
  db.session.add(todo)
  db.session.commit()
  return success_response(todo.serialize())

@app.route('/api/todo/<int:todo_id>/', methods=["POST"])
@jwt_required()
def update_todo(todo_id):
  """
  Route for updating a specific todo
  """
  current_user = get_jwt_identity()
  body = json.loads(request.data)
  title = body.get("title")
  description = body.get("description")
  due_date = body.get("due_date")
  priority = body.get("priority")
  if title is None or description is None or due_date is None or priority is None:
    return failure_response("Incorrect formatting!")
  todo = Todo.query.filter_by(id=todo_id, user_id=current_user).first()
  if todo is None:
    return failure_response("Couldn't find todo!")
  todo.title = title
  todo.description = description
  todo.due_date = due_date
  todo.priority = priority
  db.session.commit()
  return success_response(todo.serialize())

@app.route('/api/todo/<int:todo_id>/', methods=["DELETE"])
@jwt_required()
def delete_todo(todo_id):
  """
  Route for deleting a specific todo
  """
  current_user = get_jwt_identity()
  todo = Todo.query.filter_by(id=todo_id, user_id=current_user).first()
  if todo is None:
    return failure_response("Couldn't find todo!")
  db.session.delete(todo)
  db.session.commit()
  return success_response(todo.serialize())

@app.route('/api/todo/<int:todo_id>/toggle-complete/', methods=["POST"])
@jwt_required()
def toggle_todo_complete(todo_id):
  """
  Route for toggling todo completion status
  """
  current_user = get_jwt_identity()
  todo = Todo.query.filter_by(id=todo_id, user_id=current_user).first()
  if todo is None:
    return failure_response("Couldn't find todo!")
  todo.is_completed = not todo.is_completed
  if todo.is_completed:
    todo.completed_at = int(time.time() * 1000)
  else:
    todo.completed_at = None
  db.session.commit()
  return success_response(todo.serialize())

@app.route('/api/user/', methods=["POST"])
def create_user():
  """
  Route for creating a user and adding an example project and todo
  """
  body = json.loads(request.data)
  email = body.get("email")
  if email is None:
    return failure_response("Incorrect formatting!")
  password = body.get("password")
  if password is None:
    return failure_response("Incorrect formatting!")
  user = User.query.filter_by(email=email).first()
  if user is not None:
      return failure_response("User already exists!")
  
  verification_token = secrets.token_urlsafe(32)
  user = User(email=email, password=bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()), verification_token=verification_token)

  if send_verification_email(email, verification_token):
      db.session.add(user)
      db.session.commit()
      return success_response({"message": "Account created! Please check your email to verify your account."})
  else:
      return failure_response("Failed to send verification email. Please try again later.")

@app.route('/verify-email', methods=["GET"])
def verify_email():
    """
    Route for verifying a user's email
    """
    token = request.args.get("token")
    if token is None:
      return failure_response("Verification token required!")
    
    user = User.query.filter_by(verification_token=token).first()
    if user is None:
      return failure_response("Invalid verification token!")
    
    user.is_verified = True
    user.verification_token = None
    db.session.commit()
    project = Project(title="Example Project", user_id=user.id)
    db.session.add(project)
    db.session.commit()
    todo = Todo(title="Example To-Do", description="This is an example To-Do", due_date=round(time.time() * 1000), priority="low", project_id=project.id, user_id=user.id)
    db.session.add(todo)
    db.session.commit()
    return success_response({"message": "Email verified successfully! You can now log in."})

@app.route('/api/login/', methods=["POST"])
def login():
  """
  Route for logging in
  """
  body = json.loads(request.data)
  email = body.get("email")
  if email is None:
    return failure_response("Incorrect formatting!")
  password = body.get("password")
  if password is None:
    return failure_response("Incorrect formatting!")
  user = User.query.filter_by(email=email).first()
  if user is None:
    return failure_response("User not found!")
  if not user.is_verified:
    return failure_response("Need to verify email!")
  if bcrypt.checkpw(password.encode('utf-8'), user.password):
    access_token = create_access_token(identity=str(user.id))
    response = jsonify({"user": user.serialize()})
    set_access_cookies(response, access_token)
    return response
  return failure_response("Incorrect password!")

@app.route('/api/logout/', methods=["POST"])
def logout():
  """
  Route for logging out
  """
  response = jsonify({"logout": True})
  unset_jwt_cookies(response)
  return response

def reset_database():
    """
    Function for resetting the database
    """
    with app.app_context():
      db.drop_all()
      db.create_all()
      user = User(email="test@gmail.com", password=bcrypt.hashpw("password".encode('utf-8'), bcrypt.gensalt()), is_verified=True)
      db.session.add(user)
      db.session.commit()
      project = Project(title="Example Project", user_id=user.id)
      db.session.add(project)
      db.session.commit()
      todo = Todo(title="Example To-Do", description="This is an example To-Do", due_date=int(time.time() * 1000), priority="low", project_id=project.id, user_id=user.id)
      db.session.add(todo)
      db.session.commit()


if not os.path.exists(db_filename):
    reset_database()

def delete_old_completed_todos():
    """
    Function for deleting todos that were completed more than 1 week ago
    """
    with app.app_context():
        one_week_ago = int(time.time() * 1000) - (7 * 24 * 60 * 60 * 1000)
        old_completed_todos = Todo.query.filter(
            Todo.is_completed == True,
            Todo.completed_at < one_week_ago
        ).all()
        for todo in old_completed_todos:
            db.session.delete(todo)
        db.session.commit()
        print(f"Deleted {len(old_completed_todos)} old completed todos")

scheduler = BackgroundScheduler()
scheduler.add_job(func=reset_database, trigger='cron', hour=0, minute=0)
scheduler.add_job(func=delete_old_completed_todos, trigger='cron', hour=0, minute=0)
scheduler.start()
atexit.register(lambda: scheduler.shutdown())

if __name__ == "__main__":
  app.run(host="0.0.0.0", port=8000, debug=True)