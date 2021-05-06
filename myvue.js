// 1.先创建一个vue的构造函数 -- 基本结构
let a = true
function Vue(options){
  this.$el = document.querySelector(options.el)
  this.data = options.data
  this.switch = true
  this.AST = this.$el.cloneNode(true)
  this.VNodeAST = ''
  this.mount()
  reactify(this.data,this)
}

Vue.prototype.mount = function (){
  // 生成一个render 函数
  this.render = this.createRenderFun()
  this.componentMount()
}

Vue.prototype.componentMount = function (){
  let mount = ()=>{
    this.update(this.render())
  }
  mount.call(this)
}

Vue.prototype.createRenderFun = function (){//根据真实DOM 生成抽象语法树
   //AST 是有坑的虚拟DOM
  let self = this
  return function render(){
    let dataVNode =  changeTrue(makeVNode(this.AST.cloneNode(true)),self.data) //将有坑的虚拟DOM 替换成为没有坑的虚拟DOM
    let realNode = createNode(dataVNode)
    replace(self.$el,realNode)
  }
} 

function changeTrue(AST,data){
  let value = AST.value
  if(value){
    let reg = /\{\{(.+?)\}\}/g
    AST.value = AST.value.replace(reg,(_,params)=>{ //跟据正则进行匹配
      let target = getContentByPath(data,params)  //是用解析算法进行解析将模板中已有复杂变量也可以进行解析
      return target
    })
  }
  AST.children.forEach(e => {
    changeTrue(e,data)
  });
  return AST
}

Vue.prototype.update = function (){  //更新DOM的逻辑
  
}

function getContentByPath(obj,path){  //obj是目标取值对象  而path是匹配到的路径对象  格式为  a.b.c....
  let pathArr = path.split('.')
  if(pathArr.length == 1){
    return obj[path]
  }
  let target = obj
  while(index = pathArr.shift()){
    target = target[index] 
  }
  return target
}
// 定义一个编译函数，可以对模板进行编译，方便渲染函数进行渲染
function complier(templete){
  let children = templete.children
  if(children && children.length > 0){
    Array.from(children).forEach(e=>{  //将HTML类型转为数组使用foreach遍历
      complier(e)  //执行递归操作  
    })
  }else{ // 说明该节点是一个文本节点
    let reg = /\{\{(.+?)\}\}/g
    templete.innerText = templete.innerText.replace(reg,(_,params)=>{ //跟据正则进行匹配
      let target = getContentByPath(this.data,params)  //是用解析算法进行解析将模板中已有复杂变量也可以进行解析
      return target
    })
  }
}

function createNode(VNode){  //这个函数的作用是将虚拟DOM转化为真实的DOM
  let {type,attr,tag,value,children} = VNode
  if(type == 3){
    if(value.trim()!==""){
      return document.createTextNode(value)
    }else{
      return document.createTextNode('')
    }
  }else{
    let newchildren = children.filter(e => {
      return e.type == 1 || e.value.trim() != ""
    });
    let node = document.createElement(tag)
    for(var key in this.attr){
      node.setAttribute(key,this.attr[key])
    }
    newchildren.forEach(e=>{
      let childNode = createNode(e)  //对每一个子虚拟DOM节点进行递归操作
      if(childNode){
        node.appendChild(childNode)
      }
    })
    return node
  }
}
// 替换的函数
function replace(el , templete){
  complier(templete)  //通过complier编译之后，此时的templete中的变量就已经被替换了
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
  while(templete.firstChild){
    el.appendChild(templete.firstChild)
  }
}
// 创建一个虚拟DOM类
class VNode {
  constructor(tag,value,attr,type){  //attr:{id:'ID值',class:'类名'  ...  }
    this.tag = tag
    this.value = value
    this.attr = attr
    this.type = type
    this.children = []
  }
  appendChild(children){
    this.children.push(children)
  }
}
// 1.创建一个实例化虚拟DOM的函数
function createVNode(tag,value,attr,type){
  return new VNode(tag,value,attr,type)
}
// 2.对root进行分析和递归判断
function makeVNode(element){
    let children = element.childNodes
    let tag = element.nodeName && element.nodeName.toLowerCase()
    let type = element.nodeType
    let value = type == 3 ? element.nodeValue.trim() : undefined
    let attr
    if(type == 1){
      attr = {}
      let attrs = element.attributes
      for(var i=0;i<attrs.length;i++){
        attr[attrs[i].nodeName] = attrs[i].value
      }
    }else {
      attr = undefined
    }
    let VNode = createVNode(tag,value,attr,type)  //获取一个元素节点的属性
    if(children && children.length>0){  //当这个元素有子元素时
      for(var i=0;i<children.length;i++){
        VNode.appendChild(makeVNode(children[i]))
      }
    }
    return VNode
    // return children
}

let interceptor = Object.create(Array.prototype)  //让interceptor 继承自Array.prototype
let methods = ['push','pop','shift','unshift','splice']
methods.forEach(e=>{
  interceptor[e] = function (){
    console.log("我使用一下继承")
    for(var i=0;i<arguments.length;i++){
      reactify(arguments[i])
    }
    return Array.prototype[e].apply(this,arguments)
  }
})

// 需求：对数组和对象实现深度响应 数组增加可以实现响应
// 响应函数
function defineReactive(obj,key,value,enumerable){ 
  let self = this
  Object.defineProperty(obj,key,{
    enumerable:!!enumerable,
    get(){
      console.log(`取值时会触发:我的值为:${value}`)
      return value
    },
    set(newVal){
      console.log(`赋值时会触发，赋值为:${newVal}`)
      // 这里替换成为一段逻辑
      value = newVal
      self.componentMount()
    }
  })
} 
//使用递归的思想
function reactify(data,ctx){
  for(var key in data){
    let value = data[key]
    // 对data进行判断  三中情况 数组 对象 普通值
    if(typeof value !== 'object' ){ //是一个普通的值
      defineReactive.call(ctx,data,key,value,true)
    }else if(Array.isArray(value)){  //这是一个数组  让其继承interceptor
      value.__proto__ = interceptor
      value.forEach(e=>{
        reactify(e,ctx)
      })
    }else{  //这是一个对象
      reactify(value,ctx)
    }
  }
} 
