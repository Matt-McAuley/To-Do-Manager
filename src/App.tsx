import styled from '@emotion/styled'
import { useEffect, useState } from 'react';
import { Project, Todo } from './Classes';
import ProjectDisplay from './components/ProjectDisplay'
import Sidebar from './components/Sidebar';
import {TodoListContext} from './TodoListContext';
import TodoPopup from './components/TodoPopup';
import ProjectPopup from './components/ProjectPopup';
import AlertPopup from './components/AlertPopup';
import EditProjectPopup from './components/EditProjectPopup';
import ExpandPopup from './components/ExpandPopup';

const Container = styled.div`
  padding: 0;
  margin: 0;
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-rows: 15% 85%;
  grid-template-columns: 15% 85%;
  text-align: center;
  overflow: hidden;
  font-family: "DM Sans";
`;
const Header = styled.header`
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  background-color: #5680E9;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight: bold;
  font-size: 65px;
`;

const Backdrop = styled.div`
  position: fixed;
  padding: 0;
  margin: 0;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color:rgba(0,0,0,0.2);
  z-index: 1;
`;

const exampleProject = new Project("Example", 1);

type todo_db = {
  id: number;
  title: string;
  description: string;
  due_date: number;
  priority: string;
}

type project_db = {
  id: number;
  title: string;
  todos: todo_db[];
}

function App() {
  
  const [projects, setProjects] = useState([exampleProject]);
  const [currentProject, setCurrentProject] = useState(projects[0]);
  const [currentTodos, setCurrentTodos] = useState(projects[0].todos)
  const [todoPopup, setTodoPopup] = useState(false);
  const [projectPopup, setProjectPopup] = useState(false);
  const [expandPopup, setExpandPopup] = useState(false);
  const [alertPopup, setAlertPopup] = useState("");
  const [editProjectPopup, setEditProjectPopup] = useState(false);
  const [editInfo, setEditInfo] = useState({
    projectTitle: "",
    todoTitle: "",
    description: "",
    date: "",
    priority: ""
  });

  useEffect(() => {
    fetch('http://localhost:8000/api/visited/', {
      method: "GET",
    })
    .then(response => response.json())
    .then(data => {
      if (!data.visited) {
        fetch('http://localhost:8000/api/projects/', {
          method: "POST",
          body: JSON.stringify({title: "Example"})
          });
          console.log("first visit")
          const title = "Fold Laundry";
          const description = "You must fold your laundry today";
          const due_date = new Date("1/1/2024");
          const priority = "low";
          addNewTodo(title, description, due_date, priority);
      }
      else {
        fetch('http://localhost:8000/api/projects/', {
          method: "GET",
          })
          .then(response => response.json())
          .then(data => {
            console.log(data.projects);
            data.projects.forEach((project : project_db) => {
              console.log("reload")
              console.log(project);
              const title = project.title;
              const id = project.id;
              const todos = project.todos;
              const newProject = new Project(title, id);
              todos.forEach(todo => {
                const todo_id = todo.id;
                const name = todo.title;
                const description = todo.description;
                const due_date = new Date(todo.due_date);
                const priority = todo.priority;
                newProject.addTodo(new Todo(name, description, due_date, priority, todo_id));
              });
              setProjects([...projects, newProject]);
            });
          })
      }
    });
  }, [])

  const addNewTodo = ((name:string, description:string, date:Date, priority:string) => {

    for (let i = 0; i < currentProject.todos.length; i++) {
      if (currentProject.todos[i].title == name) {
        setAlertPopup("Cannot have two todos with the same name in one project!")
        return false;
      }
    }
    const localDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);

    console.log("adding")
    fetch(`http://localhost:8000/api/projects/${currentProject.id}/todo`, {
      method: "POST",
      body: JSON.stringify({
        title: name,
        description,
        due_date: localDate.getMilliseconds(),
        priority,
      })
      })
      .then(response => response.json())
      .then(data => {
        console.log("added")
        const newTodo = new Todo(name, description, localDate, priority, data.id);
        currentProject.addTodo(newTodo);
        setCurrentTodos([...(currentProject.todos)]);
        console.log(currentProject);
      })
  });

  const addNewProject = ((name:string) => {
    for (let i = 0; i < projects.length; i++) {
      if (name.toLocaleLowerCase() == "all todos" || projects[i].title.toLocaleLowerCase() == name.toLocaleLowerCase()) {
        setAlertPopup("Cannot have two projects with the same name!")
        return false;
      }
    }
    
    fetch(`http://localhost:8000/api/projects/`, {
      method: "POST",
      body: JSON.stringify({
        title: name,
      })
      })
      .then(response => response.json())
      .then(data => {
        const newProject = new Project(name, data.id);
        setProjects([...projects, newProject]);
        setCurrentProject(newProject);
        setCurrentTodos(currentProject.todos);
      })
  });

  return (
    <TodoListContext.Provider 
      value={{
        projects,
        setProjects,
        currentProject,
        currentTodos,
        setCurrentTodos,
        setCurrentProject,
        addNewTodo,
        addNewProject,
        todoPopup,
        setTodoPopup,
        projectPopup,
        setProjectPopup,
        alertPopup,
        setAlertPopup,
        editProjectPopup,
        setEditProjectPopup,
        expandPopup,
        setExpandPopup,
        editInfo,
        setEditInfo,
      }}
    >
      <Container>
        <Sidebar/>
        <Header>
          Todo Manager
        </Header>
        <ProjectDisplay/>
      </Container>
      <Backdrop style={{"display": (todoPopup || projectPopup || 
        alertPopup || expandPopup || editProjectPopup ) ? "" : "none"}}>
        <TodoPopup/>
        <ProjectPopup/>
        <AlertPopup/>
        <EditProjectPopup/>
        <ExpandPopup/>
      </Backdrop>
    </TodoListContext.Provider>
  )
}

export default App
