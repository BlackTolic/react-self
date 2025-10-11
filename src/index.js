import './styles.css';

console.log('Hello Webpack!');

// 创建一个简单的DOM元素
const app = document.getElementById('app');
const heading = document.createElement('h1');
heading.textContent = 'Hello Webpack!';
app.appendChild(heading);

const paragraph = document.createElement('p');
paragraph.textContent = '这是一个基于webpack的简单项目。';
app.appendChild(paragraph);