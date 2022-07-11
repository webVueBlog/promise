// 定义常量表示三个状态
const PENDING = 'Pending';
const RESOLVED = 'FulFilled';
const REJECTED = 'Rejected';

class MiniPromise {
 // executor 是一个执行器，进入会立即执行
 constructor(executor) {
  // 储存状态的变量，初始值是 pending
  this.status = PENDING;
  // 成功之后的值 或 失败之后的原因
  this.value = null;
  // 存储成功回调函数
  this.resolveCallbacks = [];
  // 存储失败回调函数
  this.rejectCallbacks = [];
  // 并传入resolve和reject方法
  // try catch 错误拦截
  try {
   // 普通函数this指向的是window或者undefined
   executor(this.resolve.bind(this), this.reject.bind(this))
  } catch (error) {
   this.reject(error)
  }
 }

 // 更改成功后的状态
 resolve(value) {
  // 只有状态是等待，才执行状态修改
  if (this.status === PENDING) {
   // 状态修改为成功
   this.status = RESOLVED;
   // 保存成功之后的值
   this.value = value;
   // 成功回调函数拿出来执行
   this.resolveCallbacks.forEach(onFulFilled => {
    onFulFilled(this.value)
   })
  }
 }

 // 更改失败后的状态
 reject(value) {
  // 只有状态是等待，才执行状态修改
  if(this.status === PENDING) {
   // 状态修改为失败
   this.status = REJECTED;
   // 保存失败后的原因
   this.value = value;
   // 失败回调函数拿出来执行
   this.rejectCallbacks.forEach(onRejected => {
    onRejected(this.value)
   })
  }
 }

 then(onFulFilled, onRejected){
  if(typeof onFulFilled !== 'function') {
   onFulFilled = () => {}
  }
  if(typeof onRejected !== 'function') {
   onRejected = () => {}
  }
  if(this.status === PENDING) {
   this.resolveCallbacks.push(
    () => {
     setTimeout(() => {
      try {
       onFulFilled(this.value);
      } catch (err) {
       onRejected(err);
      }
     });
    }
   );
   this.rejectCallbacks.push(
    () => {
     setTimeout(() => {
      try {
       onRejected(this.value);
      } catch (err) {
       onRejected(err);
      }
     });
    }
   );
  }
  if(this.status === RESOLVED) {
   setTimeout(() => {
    try {
     onFulFilled(this.value);
    } catch (err) {
     onRejected(err);
    }
   });
  }
  if(this.status === REJECTED) {
   setTimeout(() => {
    try {
     onRejected(this.value);
    } catch (err) {
     onRejected(err);
    }
   });
  }
 }

}

module.exports = MiniPromise;
