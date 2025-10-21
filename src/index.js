import './styles.css';
import { createRoot } from './react-dom/client';
import { useState } from 'react';
console.log('Hello Webpack!');

// 创建一个简单的DOM元素
const app = document.getElementById('app');
const heading = document.createElement('h1');
heading.textContent = 'Hello Webpack!';
app.appendChild(heading);

const paragraph = document.createElement('p');
paragraph.textContent = '这是一个基于webpa1ck的简单项目。';
app.appendChild(paragraph);

const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      <button onClick={() => setCount(c => c - 1)}>-1</button>
    </div>
  );
};
const APP = ()  =>{
    
    return <div>99999<span style={{color:'red'}}>hello webpackssss</span></div>
}
// const root = createRoot(app);
// console.log(<APP />,'APP的真实类型')
// root.render(<APP />);
const root = createRoot(app);
root.render(<Counter />);