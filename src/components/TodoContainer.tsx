import { Todo } from "../Types"
import styled from '@emotion/styled'
import { useContext } from "react"
import moment from 'moment'
import { TodoListContext, TodoListContextType } from "../TodoListContext"

const Item = styled.div`
    padding-left: 5px;
    padding-right: 5px;
    font-size: 30px;
`

const Date = styled.div`
    width: 25%;
    font-size: 25px;
    flex-grow: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
`

const Title = styled.div`
    width: 50%;
    height: 2rem;
    font-weight: 700;
    font-size: 25px;
    overflow: hidden;
    text-overflow: ellipsis;
`

const ProjectTitle = styled.div`
    font-size: 20px;
    font-weight: 700;
    padding-right: 25px;
    padding-left: 25px;
    overflow: hidden;
    text-overflow: ellipsis;
`

const Checkbox = styled.input`
    width: 25px;
    height: 25px;
    cursor: pointer;
    margin-right: 15px;
    margin-left: 10px;
    border-radius: 50%;
    appearance: none;
    border: 2px solid #333;
    position: relative;
    z-index: 10;
    &:checked {
        background-color: #5680E9;
        border-color: #5680E9;
    }
    &:checked::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 5px;
        height: 9px;
        border: solid white;
        border-width: 0 2.5px 2.5px 0;
        transform: translate(-50%, -55%) rotate(45deg);
    }
`

type Props = {
    todo: Todo;
}

const TodoContainer = (props: Props) => {
    const todo = props.todo;
    const { currentProject, setEditTodoInfo, setPopupID, toggleTodoComplete } = useContext(TodoListContext) as TodoListContextType;
    const isCompleted = todo.is_completed || false;

    const Container = styled.div`
    display:flex;
    justify-content:space-between;
    align-items: center;
    margin: 10px;
    padding: 10px;
    border: 2px solid black;
    width: 85%;
    height: 80px;
    border-radius: 7px;
    font-size: 22px;
    transition: all ease-in-out 300ms;
    cursor: pointer;
    ${isCompleted ? 'opacity: 0.5;' : ''}
    ${todo.priority === 'low' ? 'background-color: #b8ff9e;' : todo.priority === 'medium' ? 'background-color: #fff87d;' : 'background-color: #ff7d7d;'}
    ${todo.priority === 'low' ? '&:hover {background-color: #FFFFFF;}' : todo.priority === 'medium' ? '&:hover {background-color: #FFFFFF;}' : '&:hover {background-color: #FFFFFF;}'}
`;

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        toggleTodoComplete(todo.id, todo.projectId);
    };

    const handleCheckboxClick = (e: React.MouseEvent<HTMLInputElement>) => {
        e.stopPropagation();
    };

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Don't open edit popup if clicking on the checkbox
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.closest('input')) {
            return;
        }
        setEditTodoInfo({
            id: todo.id,
            title : todo.title,
            description : todo.description,
            date : moment(todo.due_date).format('MM/DD/YYYY'),
            priority : todo.priority,
            projectId : todo.projectId,
            projectTitle : todo.projectTitle
        })
        setPopupID(4);
    };

    return (
        <Container onClick={handleContainerClick}>
            <Checkbox 
                type="checkbox" 
                checked={isCompleted}
                onChange={handleCheckboxChange}
                onClick={handleCheckboxClick}
            />
            <Title>{todo.title}</Title>
            <Date style={{flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                <Item>{moment(todo.due_date).format('dddd: MM/DD/YYYY')}</Item>
                {moment(todo.due_date).dayOfYear() < moment().dayOfYear() ? <Item style={(todo.priority === 'high') ? {color: 'white', fontWeight: 'bolder'} : {color: 'red', fontWeight: 'bolder'}}>Overdue!</Item> : null}
                {moment().dayOfYear() === moment(todo.due_date).dayOfYear() ? <Item style={(todo.priority === 'high') ? {color: 'white', fontWeight: 'bolder'} : {color: 'red', fontWeight: 'bolder'}}>Due Today!</Item> : null}
            </Date>
            {(currentProject.id === -1)
                ? (
                <ProjectTitle>
                    {todo.projectTitle}
                </ProjectTitle>
                )
                : null}
        </Container>
    );
}

export default TodoContainer;