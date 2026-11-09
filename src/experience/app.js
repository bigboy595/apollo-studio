import './intro.js?v=20261109-autoplay';
const productQuery=new URLSearchParams(location.search).get('product');if(productQuery&&document.getElementById('brief-task'))document.getElementById('brief-task').value='Интересует продукт «'+productQuery.slice(0,120)+'». Задача компании: ';
