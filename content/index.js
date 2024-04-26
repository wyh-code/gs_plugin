
let ostoreInfo = {
  isFetchData: false,
  open: false,
  container: null,
  infoDom: null,
  data: []
}
const MY_LIST = 'MY_LIST';

const codes = ['000063', '002594'];

const columns = [
  {
    dataIndex: 'f14',
    title: '名称'
  },
  {
    dataIndex: 'f2',
    title: '现价'
  },
  {
    dataIndex: 'f3',
    title: '涨幅',
    render: (value) => `${value}%`
  },
  {
    dataIndex: 'f62',
    title: '主力资金'
  },
]

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === MY_LIST) {
    // 缓存股票列表数据
    localStorage.setItem(MY_LIST, request.data);
    // 向popup发送响应
    sendResponse({ res: "ok" });
  }

  // 如果你想做异步处理，返回true表示将异步发送响应
  return true;
});

function injectDom(tagName) {
  const container = document.createElement(tagName);
  const body = document.getElementsByTagName('body')[0];
  body.appendChild(container);

  return container;
}

function addEventListenerFunc(id, eventName, func) {
  const dom = document.getElementById(id);
  if (dom) {
    dom.addEventListener(eventName, (e) => {
      // 判断是否是disabled
      const classList = dom.className;
      if (classList.includes('ostore-btn-disabled')) {
        console.log('禁用状态')
        return;
      }
      // 执行函数
      func(e);
    })
  } else {
    requestAnimationFrame(() => addEventListenerFunc(id, eventName, func));
  }
}

function initContainer() {
  const container = injectDom('div');
  console.log('content');
  container.innerHTML = `
    <div class="ostore-gs-plugin" id="ostore-gs-plugin">
      GS
    </div>
  `
  ostoreInfo.container = container;
}

function filterCode(item) {
  const myString = localStorage.getItem(MY_LIST);
  let myList = [];
  if (myString) {
    myList = JSON.parse(myString);
  }
  const codes = myList.map(it => it.code);
  return codes.includes(item.f12);
}

function fetchData() {
  const url = 'https://push2.eastmoney.com/api/qt/clist/get?cb=callback&fid=f62&po=1&pz=6000&pn=1&np=1&fltt=2&invt=2&ut=b2884a393a59ad64002292a3e90d46a5&fs=m%3A0%2Bt%3A6%2Bf%3A!2%2Cm%3A0%2Bt%3A13%2Bf%3A!2%2Cm%3A0%2Bt%3A80%2Bf%3A!2%2Cm%3A1%2Bt%3A2%2Bf%3A!2%2Cm%3A1%2Bt%3A23%2Bf%3A!2%2Cm%3A0%2Bt%3A7%2Bf%3A!2%2Cm%3A1%2Bt%3A3%2Bf%3A!2&fields=f12%2Cf14%2Cf2%2Cf3%2Cf62%2Cf184%2Cf66%2Cf69%2Cf72%2Cf75%2Cf78%2Cf81%2Cf84%2Cf87%2Cf204%2Cf205%2Cf124%2Cf1%2Cf13';

  // const hours = new Date().getHours();
  // const minutes = new Date().getMinutes();
  // const flag = true;
  // const flag = (hours > 8 && hours < 15) && (hours < 10 ? minutes > 29 : true);
  if (ostoreInfo.open) {
    if (!ostoreInfo.isFetchData) {
      ostoreInfo.isFetchData = true;
      console.log('fetch start')
      fetch(url).then(res => res.text()).then(res => {
        console.log('fetch end')
        ostoreInfo.isFetchData = false;
        const jsonString = res.match(/callback\((.*)\)/)[1];
        const json = JSON.parse(jsonString);
        const list = json.data.diff;
        const data = list.filter(filterCode);
        ostoreInfo.data = data;
        renderInfo();
        setTimeout(() => {
          fetchData()
        }, 500)
        // window.requestAnimationFrame();
      })
    }
  } else {
    setTimeout(() => {
      fetchData()
    }, 500)
    // window.requestAnimationFrame(fetchData);
  }
}

function renderInfo() {
  if (ostoreInfo.open) {
    if (!ostoreInfo.infoDom) {
      const dom = document.createElement('div');
      ostoreInfo.container.appendChild(dom);
      ostoreInfo.infoDom = dom;
    }

    if(ostoreInfo.data && ostoreInfo.data.length) {
      ostoreInfo.infoDom.innerHTML = `
        <div class="ostore-gs-plugin ostore-gs-plugin-info" id="ostore-gs-plugin-info">
          <table><tbody>
            ${ostoreInfo.data.map(record => (`
              <tr>${columns.map(item => `
                <td class="ostore-gs-plugin-info-td">
                  ${item.render ? item.render(record[item.dataIndex]) : record[item.dataIndex]}
                </td>`).join('')}
              </tr>
            `)).join('')}
          </tbody></table>
        </div>
      `
    } else {
      ostoreInfo.infoDom.innerHTML = `<div class="ostore-gs-plugin ostore-gs-plugin-info">请先添加股票数据</div>`
    }
  }
}

function openInfo() {
  if (ostoreInfo.open) {
    ostoreInfo.infoDom?.remove();
    ostoreInfo.infoDom = null;
    ostoreInfo.open = false;
  } else {
    ostoreInfo.open = true;
  }
}

function initEvent() {
  addEventListenerFunc('ostore-gs-plugin', 'click', openInfo);
}

// 初始化
function load() {
  initContainer();
  fetchData();
  initEvent();
}

window.addEventListener('load', load);
