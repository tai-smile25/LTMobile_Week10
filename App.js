import React, { useState, useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { call, put, takeEvery } from 'redux-saga/effects';
import { Button, Text, TextInput, View, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Action Types
const FETCH_TASKS_REQUEST = 'FETCH_TASKS_REQUEST';
const FETCH_TASKS_SUCCESS = 'FETCH_TASKS_SUCCESS';
const FETCH_TASKS_FAILURE = 'FETCH_TASKS_FAILURE';
const ADD_TASK = 'ADD_TASK';
const UPDATE_TASK = 'UPDATE_TASK';

// Action Creators
const fetchTasksRequest = () => ({ type: FETCH_TASKS_REQUEST });
const fetchTasksSuccess = (tasks) => ({ type: FETCH_TASKS_SUCCESS, tasks });
const fetchTasksFailure = (error) => ({ type: FETCH_TASKS_FAILURE, error });
const addTask = (task) => ({ type: ADD_TASK, task });
const updateTask = (task) => ({ type: UPDATE_TASK, task });

// Reducer
const initialState = {
  tasks: [],
  loading: false,
  error: null,
};

function tasksReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_TASKS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_TASKS_SUCCESS:
      return { ...state, loading: false, tasks: action.tasks };
    case FETCH_TASKS_FAILURE:
      return { ...state, loading: false, error: action.error };
    case ADD_TASK:
      return { ...state, tasks: [...state.tasks, { ...action.task, id: Date.now() }] };
    case UPDATE_TASK:
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.task.id ? { ...t, ...action.task } : t
        ),
      };
    default:
      return state;
  }
}

// Mock API function
function fetchTasksApi() {
  return new Promise((resolve) =>
    setTimeout(() =>
      resolve([
        { id: 1, title: 'Check email', completed: false },
        { id: 2, title: 'Finish report', completed: true },
        { id: 3, title: 'Prepare meeting', completed: false },
      ]), 1000)
  );
}

// Saga
function* fetchTasksSaga() {
  try {
    const tasks = yield call(fetchTasksApi);
    yield put(fetchTasksSuccess(tasks));
  } catch (error) {
    yield put(fetchTasksFailure(error.toString()));
  }
}

function* rootSaga() {
  yield takeEvery(FETCH_TASKS_REQUEST, fetchTasksSaga);
}

// Saga Middleware
const sagaMiddleware = createSagaMiddleware();
const rootReducer = combineReducers({ tasks: tasksReducer });
const store = createStore(rootReducer, applyMiddleware(sagaMiddleware));
sagaMiddleware.run(rootSaga);

// Stack Navigator
const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
  const [name, setName] = useState('');

  return (
    <View style={styles.container}>
      <Image source={require('./assets/notebut.png')} style={styles.image} />
      <Text style={styles.title}>MANAGE YOUR TASK</Text>
      <TextInput
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <Button
        title="Get Started"
        onPress={() => navigation.navigate('Screen1', { userName: name })}
      />
    </View>
  );
}

function Screen1({ route, navigation }) {
  const { userName } = route.params;
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector((state) => state.tasks);

  useEffect(() => {
    dispatch(fetchTasksRequest());
  }, [dispatch]);

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('./assets/avatar1.jpeg')} style={styles.avatar} />
        <Text style={styles.greeting}>Hi {userName}</Text>
      </View>
      <Text style={styles.subText}>Have a great day ahead</Text>
      <TextInput style={styles.searchInput} placeholder="Search tasks..." />
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <TouchableOpacity
              onPress={() => dispatch(updateTask({ ...item, completed: !item.completed }))}
            >
              <Icon
                name={item.completed ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color="black"
              />
            </TouchableOpacity>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Screen2', { task: item, userName })}>
              <Icon name="edit" size={24} color="black" />
            </TouchableOpacity>
          </View>
        )}
      />
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('Screen2', { task: null, userName })}>
        <Icon name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

function Screen2({ route, navigation }) {
  const dispatch = useDispatch();
  const { task, userName } = route.params;
  const [taskTitle, setTaskTitle] = useState(task ? task.title : '');

  const handleSave = () => {
    if (task) {
      dispatch(updateTask({ ...task, title: taskTitle }));
    } else {
      dispatch(addTask({ title: taskTitle, completed: false }));
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('./assets/avatar1.jpeg')} style={styles.avatar} />
        <Text style={styles.greeting}>Hi {userName}</Text>
      </View>
      <Text style={styles.subText}>Have a great day ahead</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter task title"
        value={taskTitle}
        onChangeText={setTaskTitle}
      />
      <Image source={require('./assets/notebut.png') } style={styles.image} />
      <Button title="Save Task" onPress={handleSave} />
      <Button title="Cancel" color="red" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  image: { width: 150, height: 150, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: 'rgba(131, 83, 226, 1)' },
  input: { height: 40, width: '100%', borderColor: 'gray', borderWidth: 1, paddingLeft: 10, marginBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  greeting: { fontSize: 20, fontWeight: 'bold' },
  subText: { fontSize: 16, color: 'gray', marginBottom: 20 },
  searchInput: { height: 40, borderColor: '#ccc', borderWidth: 1, paddingHorizontal: 10, marginBottom: 20 },
  taskItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomColor: '#ccc', borderBottomWidth: 1 },
  taskTitle: { flex: 1, marginLeft: 10, fontSize: 16 },
  addButton: { position: 'absolute', right: 20, bottom: 20, backgroundColor: 'blue', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
});

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Screen1" component={Screen1} />
          <Stack.Screen name="Screen2" component={Screen2} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}
