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


// let obj = {
//   a:{
//     b:{
//       c:{
//         d:"我是一个的最底层子元素"
//       }
//     }
//   }
// }

// console.log(getContentByPath(obj,'a.b.c'))  //测试成功