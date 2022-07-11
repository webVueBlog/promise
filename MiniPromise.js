// 定义常量表示三个状态
const PENDING = 'Pending'; // 准备状态
const RESOLVED = 'FulFilled'; //  解决状态
const REJECTED = 'Rejected'; //   拒绝状态

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
   setTimeout(() => {
    this.resolveCallbacks.forEach(onFulFilled => {
     onFulFilled(this.value)
    })
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
   setTimeout(() => {
    this.rejectCallbacks.forEach(onRejected => {
     onRejected(this.value)
    })
   })
  }
 }

 // 实现.then()的链式穿透
 then(onFulFilled, onRejected) {
  onFulFilled = typeof onFulFilled === 'function' ? onFulFilled : v => v
  onRejected = typeof onRejected === 'function' ? onRejected : err => { throw err };

  let promise2 = new Promise((resolve, reject) => {
   if(this.status === PENDING) {
    this.resolveCallbacks.push(() => {
     setTimeout(() => {
      try {
       let x = onFulFilled(this.value)
       resolvePromise(x, promise2, resolve, reject)
      } catch (err) {
       reject(err)
      }
     })
    });
    this.rejectCallbacks.push(() => {
     setTimeout(() => {
      try {
       let x = onRejected(this.value)
       resolvePromise(x, promise2, resolve, reject)
      } catch (err) {
       reject(err);
      }
     })
    });
   }
   if(this.status === RESOLVED) {
    setTimeout(() => {
     try {
      let x = onFulFilled(this.value)
      resolvePromise(x, promise2, resolve, reject)
     } catch (err) {
      reject(err)
     }
    })
   }
   if(this.status === REJECTED) {
    setTimeout(() => {
     try {
      let x = onRejected(this.value)
      resolvePromise(x, promise2, resolve, reject)
     } catch (err) {
      reject(err)
     }
    })
   }
  })
  return promise2
 }

 // 静态resolve方法 返回一个promise对象
 static resolve(value) {
  if(value instanceof MiniPromise) return value;
  return new MiniPromise(resolve => resolve(value))
 }

 // 静态reject方法 返回一个promise对象
 static reject(value) {
  return new MiniPromise((resolve, reject) => reject(value))
 }
}

function resolvePromise(x, promise2, resolve, reject) {
 if(x === promise2) {
  return reject(new TypeError('Chaining cycle detected for promise!'))
 }
 if(x && (typeof x === 'object' || typeof x === 'function')) {
  let called;
  try {
   let then = x.then;
   if(typeof then === 'function') {
    then.call(x, value => {
     if(called) return;
     called = true;
     resolvePromise(value, promise2, resolve, reject)
    }, reason => {
     if(called) return;
     called = true;
     reject(reason);
    })
   } else {
    resolve(x)
   }
  } catch (err) {
   if(called) return;
   called = true;
   reject(err)
  }
 } else {
  resolve(x)
 }
}

module.exports = MiniPromise;
