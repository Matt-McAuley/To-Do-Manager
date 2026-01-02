import { createContext } from "react";
import { Project } from "./Types";

export type TodoListContextType = {
    projects : Project[];
    setProjects : React.Dispatch<React.SetStateAction<Project[]>>;
    currentProject : Project;
    setCurrentProject : React.Dispatch<React.SetStateAction<Project>>;
    addNewTodo : (title: string, description: string, date: number, priority: string) => void;
    editTodo : (id: number, title: string, description: string, date: number, priority: string, projectId: number) => void;
    deleteTodo : (id: number, projectId: number) => void;
    toggleTodoComplete : (id: number, projectId: number) => void;
    addNewProject: (title: string) => false | undefined;
    editProject: (id: number, title: string) => void;
    deleteProject: (id: number) => void;
    popupID : number;
    setPopupID: React.Dispatch<React.SetStateAction<number>>;
    editTodoInfo: {
        id: number;
        title: string;
        description: string;
        date: string;
        priority: string;
        projectId: number;
        projectTitle: string;
    }
    setEditTodoInfo: React.Dispatch<React.SetStateAction<{
        id: number;
        title: string;
        description: string;
        date: string;
        priority: string;
        projectId: number;
        projectTitle: string;
    }>>,
    editProjectInfo: {
        id: number;
        title: string;
    }
    setEditProjectInfo: React.Dispatch<React.SetStateAction<{
        id: number;
        title: string;
    }>>,
    notify: (text: string) => void,
}

export const TodoListContext = createContext<TodoListContextType | null>(null);