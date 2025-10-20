import './styles.css';
import { createRoot } from './react-dom/client';
console.log('Hello Webpack!');

// 创建一个简单的DOM元素
const app = document.getElementById('app');
const heading = document.createElement('h1');
heading.textContent = 'Hello Webpack!';
app.appendChild(heading);

const paragraph = document.createElement('p');
paragraph.textContent = '这是一个基于webpa1ck的简单项目。';
app.appendChild(paragraph);



const APP = ()  =>{
    return <div>99999<span style={{color:'red'}}>hello webpackssss</span></div>
}
console.log(app,'app')
const root = createRoot(app);
console.log(<APP />,'(<APP />')
root.render(<APP />);