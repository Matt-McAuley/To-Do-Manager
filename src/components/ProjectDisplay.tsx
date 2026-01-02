import { Todo } from "../Types";
import TodoContainer from "./TodoContainer";
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import { TodoListContext, TodoListContextType } from "../TodoListContext";
import { useContext } from "react";
import { PropTypes } from "@mui/material";
import moment from 'moment';

const Container = styled.div`
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  background-color: #C1C8E4;
  display:flex;
  flex-direction:column;
  position: relative;
  padding: 0;
  overflow-y: auto;
`;

const TodoSection = styled.div`
    display:flex;
    flex-direction:column;
    justify-content:start;
    align-items:center;
    height: 100%;
    border-bottom: 3px solid black;
`;

const Timeframe = styled.div`
    font-size: 30px;
    font-weight: 700;
    padding: 10px;
`;

const LoadingContainer = styled.div`
    background-color: #C1C8E4;
    display:flex;
    height:100vh;
    width:100%;
    justify-content:center;
    align-items:center;
`

const LoadingWave = styled.div`
    width: 300px;
    height: 100px;
    display: flex;
    justify-content: center;
    align-items: flex-end;
`

const LoadingWaveAnimation = keyframes`
    0% {
        height: 10px;
    }

    50% {
        height: 50px;
    }

    100% {
        height: 10px;
    }
`

const LoadingBar = styled.div`
    width: 20px;
    height: 10px;
    margin: 0 5px;
    background-color: #5680E9;
    border-radius: 5px;
    animation: ${LoadingWaveAnimation} 1s ease-in-out infinite;
    &:nth-child(2) {
        animation-delay: 0.1s;
    }
    &:nth-child(3) {
        animation-delay: 0.2s;
    }
    &:nth-child(4) {
        animation-delay: 0.3s;
    }
`

type PropTypes = {
    loading : boolean;
}

const ProjectDisplay = (props : PropTypes) => {

    const { currentProject } = useContext(TodoListContext) as TodoListContextType;

    return props.loading 
    ? (
        <LoadingContainer>
            <LoadingWave>
                <LoadingBar/>
                <LoadingBar/>
                <LoadingBar/>
                <LoadingBar/>
            </LoadingWave>
        </LoadingContainer>
    )
    : (
        <Container>
            <TodoSection>
                <Timeframe>Overdue</Timeframe>
                {currentProject.todos.filter((todo: Todo) => !(todo.is_completed === true) && moment(todo.due_date).isBefore(moment().startOf('day'))).map((todo: Todo, index: number) => (
                    <TodoContainer key={index} todo={todo}/>
                ))}
            </TodoSection>
            <TodoSection>
                <Timeframe>Today</Timeframe>
                {currentProject.todos.filter((todo: Todo) => !(todo.is_completed === true) && moment(todo.due_date).isBefore(moment().endOf('day')) && moment(todo.due_date).isAfter(moment().endOf('day').subtract(1, 'day'))).map((todo: Todo, index: number) => (
                    <TodoContainer key={index} todo={todo}/>
                ))}
            </TodoSection>
            <TodoSection>
                <Timeframe>Tomorrow</Timeframe>
                {currentProject.todos.filter((todo: Todo) => !(todo.is_completed === true) && moment(todo.due_date).isBefore(moment().endOf('day').add(1, 'day')) && moment(todo.due_date).isAfter(moment().endOf('day'))).map((todo: Todo, index: number) => (
                    <TodoContainer key={index} todo={todo}/>
                ))}
            </TodoSection>
            <TodoSection>
                <Timeframe>This Week</Timeframe>
                {currentProject.todos.filter((todo: Todo) => !(todo.is_completed === true) && moment(todo.due_date).isBefore(moment().endOf('week')) && moment(todo.due_date).isAfter(moment().endOf('day').add(1, 'day'))).map((todo: Todo, index: number) => (
                    <TodoContainer key={index} todo={todo}/>
                ))}
            </TodoSection>
            <TodoSection>
                <Timeframe>This Month</Timeframe>
                {currentProject.todos.filter((todo: Todo) => !(todo.is_completed === true) && moment(todo.due_date).isBefore(moment().endOf('month')) && moment(todo.due_date).isAfter(moment().endOf('week'))).map((todo: Todo, index: number) => (
                    <TodoContainer key={index} todo={todo}/>
                ))}
            </TodoSection>
            <TodoSection>
                <Timeframe>This Year</Timeframe>
                {currentProject.todos.filter((todo: Todo) => !(todo.is_completed === true) && moment(todo.due_date).isBefore(moment().endOf('year')) && moment(todo.due_date).isAfter(moment().endOf('month'))).map((todo: Todo, index: number) => (
                    <TodoContainer key={index} todo={todo}/>
                ))}
            </TodoSection>
            <TodoSection>
                <Timeframe>Far Away</Timeframe>
                {currentProject.todos.filter((todo: Todo) => !(todo.is_completed === true) && moment(todo.due_date).isAfter(moment().endOf('year'))).map((todo: Todo, index: number) => (
                    <TodoContainer key={index} todo={todo}/>
                ))}
            </TodoSection>
            <TodoSection>
                <Timeframe>Completed</Timeframe>
                {currentProject.todos.filter((todo: Todo) => todo.is_completed === true).sort((a: Todo, b: Todo) => {
                    // Sort by completed_at descending (most recent first), or by due_date if no completed_at
                    if (a.completed_at && b.completed_at) {
                        return b.completed_at - a.completed_at;
                    }
                    return b.due_date - a.due_date;
                }).map((todo: Todo, index: number) => (
                    <TodoContainer key={index} todo={todo}/>
                ))}
            </TodoSection>
        </Container>
    );
}

export default ProjectDisplay;