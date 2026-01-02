import styled from '@emotion/styled'
import { useState, useEffect } from 'react';
import {Project, editProjectInfo, editTodoInfo} from '../Types.ts';
import ProjectDisplay from '../components/ProjectDisplay.tsx'
import Sidebar from '../components/Sidebar.tsx';
import { TodoListContext } from '../TodoListContext.ts';
import PopupArea from '../components/PopupArea.tsx';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router';
import { backendURL } from '../constants.ts';

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
  font-family: "DM Sans", serif;
`;
const Header = styled.header`
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  background-color: #5680E9;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight: bold;
  font-size: 85px;
`;

const LogoutButton = styled.button`
  border: 1px solid black;
  border-radius: 8px;
  width: 200px;
  height: 50px;
  background-color: #5AB9EA;
  cursor: pointer;
  font-size: 22px;
  &:hover {
    box-shadow: 0 37px 20px -20px rgba(0,0,0,0.2);
    transform: translate(0px, -5px) scale(1.05);
  }
  transition: all ease-in-out 300ms;
  margin-top: 10px;
  margin-bottom: 18px;
  position: absolute;
  right: 20px;
  top: 10px;
`;

function App() {
  
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([{
    id: 0,
    title: "Loading...",
    todos: []
  }]);
  const [currentProject, setCurrentProject] = useState<Project>(projects[0]);
  const [editTodoInfo, setEditTodoInfo] = useState<editTodoInfo>({
    id: -1,
    title: "",
    description: "",
    date: "",
    priority: "",
    projectId: -1,
    projectTitle: "",
  });
  const [editProjectInfo, setEditProjectInfo] = useState<editProjectInfo>({
    id: -1,
    title: "",
  });
  const [popupID, setPopupID] = useState(-1);
  const navigate = useNavigate();

  const notify = (text: string) => {
    toast.error(text, {
      position: "top-right",
      autoClose: 3000,
      theme: "colored",
      pauseOnHover: false,
    });
  }

  useEffect(() => {
    fetch(`${backendURL}/api/projects/`, {
      method: "GET",
      credentials: "include",
      })
      .then(response => {
        if (!response.ok) {
          navigate('/');
          return;
        }
        return response.json()
      })
      .then(data => {
        let new_projects : Project[] = [];
        data.projects.sort((a: Project, b: Project) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
        data.projects.forEach((project : Project) => {
          project.todos.map(todo => {
              todo.projectId = project.id;
              todo.projectTitle = project.title;
          });
          project.todos.sort((a, b) => a.due_date - b.due_date);
          new_projects = ([...new_projects, project]);
        });
        setProjects(new_projects);
        setCurrentProject({
          id: -1,
          title: "View All",
          todos: new_projects.map(project => project.todos).flat().sort((a, b) => a.due_date - b.due_date),
        });
        setLoading(false);
      });
  }, [navigate])

  const addNewTodo = ((title:string, description:string, due_date:number, priority:string) => {
    for (let i = 0; i < currentProject.todos.length; i++) {
      if (currentProject.todos[i].title == title) {
        notify('Cannot have two todos with the same name in one project!');
        return false;
      }
    }
    fetch(`${backendURL}/api/projects/${currentProject.id}/todo`, {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
        due_date,
        priority,
      }),
      credentials: "include",
    })
        .then(response => response.json())
        .then(data => {
          const updated_project: Project = {
            id: currentProject.id,
            title: currentProject.title,
            todos: [...currentProject.todos, {
              id: data.id,
              title,
              description,
              due_date: due_date,
              priority,
              projectId: currentProject.id,
              projectTitle: currentProject.title,
              is_completed: data.is_completed || false,
              completed_at: data.completed_at || null,
            }].sort((a, b) => a.due_date - b.due_date),
          };
          const updatedProjects = [...projects.filter((proj) => proj.id != currentProject.id), updated_project]
            .sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
          setProjects(updatedProjects);
          setCurrentProject(updated_project);
        });
    });

  const editTodo = (id: number, title:string, description:string, due_date:number, priority:string, projectId: number) => {
    const parentProject = projects.find(proj => proj.id == projectId)!;
    const other_todos = parentProject.todos.filter((ele) => ele.id != id);
    for (let i = 0; i < other_todos.length; i++) {
      if (other_todos[i].title == title) {
        notify('Cannot have two todos with the same name in one project!');
        return false;
      }
    }
    fetch(`${backendURL}/api/todo/${id}/`, {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
        due_date,
        priority,
      }),
      credentials: "include",
    }).then(response => response.json())
      .then(() => {
          const updated_project : Project = {
              id: projectId,
              title: parentProject.title,
              todos: [...parentProject.todos.filter((ele) => ele.id != id), {
              id,
              title,
              description,
              due_date,
              priority,
              projectId: projectId,
              projectTitle: parentProject.title,
              is_completed: parentProject.todos.find(t => t.id === id)?.is_completed || false,
              completed_at: parentProject.todos.find(t => t.id === id)?.completed_at || null,
              }].sort((a, b) => a.due_date - b.due_date),
          }
          const updatedProjects = [...projects.filter((proj) => proj.id != projectId), updated_project]
              .sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
          setProjects(updatedProjects);
          if (currentProject.id === -1) {
              setCurrentProject({
                  id: -1,
                  title: "View All",
                  todos: updatedProjects.map(project => project.todos).flat().sort((a, b) => a.due_date - b.due_date),
              });
          }
          else
              setCurrentProject(updated_project);
      });
  }

  const deleteTodo = (id: number, projectId: number) => {
      fetch(`${backendURL}/api/todo/${id}/`, {
          method: "DELETE",
          credentials: "include",
      });
      const parentProject = projects.find((proj) => proj.id === projectId)!;
      const updated_project : Project = {
          id: parentProject.id,
          title: parentProject.title,
          todos: parentProject.todos.filter((ele) => ele.id != id),
      };
      const updatedProjects = [...projects.filter((proj) => proj.id != projectId), updated_project]
          .sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
      setProjects(updatedProjects);
      if (currentProject.id === -1) {
          setCurrentProject({
              id: -1,
              title: "View All",
              todos: updatedProjects.map(project => project.todos).flat().sort((a, b) => a.due_date - b.due_date),
          });
      }
      else
          setCurrentProject(updated_project);
  }

  const toggleTodoComplete = (id: number, projectId: number) => {
      fetch(`${backendURL}/api/todo/${id}/toggle-complete/`, {
          method: "POST",
          credentials: "include",
      })
      .then(response => response.json())
      .then(data => {
          const parentProject = projects.find((proj) => proj.id === projectId)!;
          const updated_todos = parentProject.todos.map(todo => 
              todo.id === id 
                  ? { ...todo, is_completed: data.is_completed, completed_at: data.completed_at }
                  : todo
          );
          const updated_project : Project = {
              id: parentProject.id,
              title: parentProject.title,
              todos: updated_todos,
          };
          const updatedProjects = [...projects.filter((proj) => proj.id != projectId), updated_project]
              .sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
          setProjects(updatedProjects);
          if (currentProject.id === -1) {
              setCurrentProject({
                  id: -1,
                  title: "View All",
                  todos: updatedProjects.map(project => project.todos).flat().sort((a, b) => a.due_date - b.due_date),
              });
          }
          else
              setCurrentProject(updated_project);
      });
  }

  const addNewProject = ((title:string) => {
    for (let i = 0; i < projects.length; i++) {
      if (projects[i].title.toLocaleLowerCase() == title.toLocaleLowerCase()) {
        notify('Cannot have two projects with the same name!');
        return false;
      }
    }
    fetch(`${backendURL}/api/projects/`, {
      method: "POST",
      body: JSON.stringify({
        title,
        todos: [],
      }),
      credentials: "include",
    })
        .then(response => response.json())
        .then(data => {
          const new_project: Project = {
            id: data.id,
            title,
            todos: data.todos,
          };
          setProjects([...projects, new_project].sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase())));
          setCurrentProject(new_project);
        })
  });

  const editProject = (id: number, title: string) => {
    const editedProject = projects.find(proj => proj.id == id)!;
    const otherProjects = projects.filter((project) => project.id !== id);
    for (let i = 0; i < otherProjects.length; i++) {
      if (otherProjects[i].title.toLocaleLowerCase() == title.toLocaleLowerCase()) {
        notify('Cannot have two projects with the same name!');
        return false;
      }
    }
    fetch(`${backendURL}/api/projects/${id}/`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        title,
      }),
    }).then(response => response.json())
      .then(() => {
        const updated_project : Project = {
          id,
          title,
          todos: editedProject.todos,
          }
          setProjects([...projects.filter((proj) => proj.id != id), updated_project]
              .sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase())));
          setCurrentProject(updated_project);
        });
  }

  const deleteProject = (id: number) => {
      if (projects.length > 1) {
          fetch(`${backendURL}/api/projects/${id}/`, {
              method: "DELETE",
              credentials: "include",
          });
          const updatedProjects = projects.filter((ele) => ele.id !== id);
          setProjects(updatedProjects);
          setCurrentProject({
              id: -1,
              title: "View All",
              todos: updatedProjects.map(project => project.todos).flat().sort((a, b) => a.due_date - b.due_date),
          });
      }
      else {
          notify('Must have at least one project!');
          return;
      }
    }

  const logout = () => {
    fetch(`${backendURL}/api/logout/`, {
      method: "POST",
      credentials: "include",
    })
    .then(response => {
      if (!response.ok) {
        notify("Failed to logout");
        return;
      }
      navigate('/');
  })};

  return (
    <TodoListContext.Provider 
      value={{
        projects,
        setProjects,
        currentProject,
        setCurrentProject,
        addNewTodo,
        editTodo,
        deleteTodo,
        toggleTodoComplete,
        addNewProject,
        editProject,
        deleteProject,
        popupID,
        setPopupID,
        editTodoInfo,
        setEditTodoInfo,
        editProjectInfo,
        setEditProjectInfo,
        notify,
      }}
    >
      <ToastContainer/>
      <Container>
        <Sidebar/>
        <Header>
          To-Do Manager
          <LogoutButton onClick={logout}>Logout</LogoutButton>
        </Header>
        <ProjectDisplay loading={loading}/>
      </Container>
      <PopupArea/>
    </TodoListContext.Provider>
  )
}

export default App