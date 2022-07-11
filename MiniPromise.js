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

 // 静态all 方法 接受一个数组作为参数，返回一个promise实例对象
 static all(list) {
  return new MiniPromise((resolve, reject) => {
   // 定义一个数组用于存储返回的值
   let _value = [];
   // 定义一个计算字段来标识返回成功状态的promise
   let count = 0
   for (let [i, p] of list.entries()) {
    this.resolve(p).then(res => {
     _value[i] = res
     count++
     // 当数组的长度和count值相等的时候，表示所有的都成功返回值了，那么执行成功的方法
     if (count === list.length) resolve(_value) 
    }, (err) => {
     reject(err)
    })
   }
  })
 }

 // 静态race 方法 接受一个数组作为参数，返回一个promise实例对象
 static race(list) {
  return new MiniPromise((resolve, reject) => {
   for(let p of list) {
    this.resolve(p).then(res => {
     resolve(res)
    }, err => reject(err))
   }
  })
 }

 // 静态finally方法
 // 表示不管最后promise的状态如何 都会执行的操作接受一个回调函数作为参数
 // 也是返回一个promise对象，执行promise对象的then函数
 static finally(cb) {
  return this.then(
   value => MiniPromise.resolve(cb()).then(() => value),
   reason => MiniPromise.reject(cb()).then(() => { throw reason })
  )
 }

 // 静态方法any
 // resolve必须等到有一个成功的结果
 // reject所有的都失败才执行reject
 static any(promises) {
  const _reasons = []
  return new MiniPromise((resolve, reject) => {
   promises.forEach(promise => {
    promise.then(resolve, err => {
     _reasons.push(err)
     if(_reasons.length === promises.length) {
      reject(new AggregateError(_reasons))
     }
    }) 
   })
  })
 }

 // Promise.allSettled 静态方法是在所有给定的promise都已经fulfilled或rejected的promise
 // 并带有一个对象数组，每个对象表示对应的promise结果
 static allSettled(promises) {
  let _result = [];
  return new MiniPromise((resolve, reject) => {
   promises.forEach(promise => {
    if(_result.length === promises.length) {
     resolve(_result);
    }
    promise.then(res => {
     _result.push({
      status: 'fulfilled',
      value: res
     })
    }, err => {
     _result.push({
      status: 'rejected',
      reason: err
     })
    })
   })
  })
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
