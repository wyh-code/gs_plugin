const GS_LIST = 'GS_LIST';
const MY_LIST = 'MY_LIST';
const url = 'https://push2.eastmoney.com/api/qt/clist/get?cb=callback&fid=f62&po=1&pz=6000&pn=1&np=1&fltt=2&invt=2&ut=b2884a393a59ad64002292a3e90d46a5&fs=m%3A0%2Bt%3A6%2Bf%3A!2%2Cm%3A0%2Bt%3A13%2Bf%3A!2%2Cm%3A0%2Bt%3A80%2Bf%3A!2%2Cm%3A1%2Bt%3A2%2Bf%3A!2%2Cm%3A1%2Bt%3A23%2Bf%3A!2%2Cm%3A0%2Bt%3A7%2Bf%3A!2%2Cm%3A1%2Bt%3A3%2Bf%3A!2&fields=f12%2Cf14%2Cf2%2Cf3%2Cf62%2Cf184%2Cf66%2Cf69%2Cf72%2Cf75%2Cf78%2Cf81%2Cf84%2Cf87%2Cf204%2Cf205%2Cf124%2Cf1%2Cf13';
const codeInput = document.getElementById('ostoreGsPluginPopupCode');
const addBtn = document.getElementById('ostoreGsPluginPopupBtn');
const listContainer = document.getElementById('ostoreGsPluginPopupListItemContent');

async function getCodeList() {
  const res = await fetch(url).then(res => res.text());
  const jsonString = res.match(/callback\((.*)\)/)[1];
  const json = JSON.parse(jsonString);
  const list = json.data.diff;
  localStorage.setItem(GS_LIST, JSON.stringify(list))
}

function renderList() {
  const gsString = localStorage.getItem(GS_LIST);
  const myString = localStorage.getItem(MY_LIST);
  console.log('myString: ', myString)
  if (gsString) {
    const list = JSON.parse(myString);
    listContainer.innerHTML = myString ? `
      <table>
        <tbody>
          ${list.map(item => `<tr>
            ${`
            <td class='ostore-gs-plugin-popup-list-item-content-td'>${item.name}</td>
            <td class='ostore-gs-plugin-popup-list-item-content-td'>${item.code}</td>
            <td class='ostore-gs-plugin-popup-list-item-content-td-btn' data-code="${item.code}">删除</td>
            `}
          </tr>`).join('')}
        </tbody>
      </table>
    ` : '请添加股票'

    // 将数据发送content
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // tabs[0] 是当前选中的标签页
      chrome.tabs.sendMessage(tabs[0].id, { type: 'MY_LIST', data: myString }, function (response) {
        console.log(response?.res);
      });
    });
  } else {
    listContainer.innerHTML = '数据接口已失效'
  }
}

addBtn.addEventListener('click', () => {
  const listString = localStorage.getItem(GS_LIST);
  const myString = localStorage.getItem(MY_LIST);
  if (listString) {
    const list = JSON.parse(listString);
    const code = codeInput.value;
    const gp = list.find(item => item.f12 === code);
    if (gp) {
      const myList = myString ? JSON.parse(myString) : [];
      const target = myList.find(it => gp.code === it.f12);
      if (!target) {
        myList.push({
          code: gp.f12,
          name: gp.f14
        })
      }
      localStorage.setItem(MY_LIST, JSON.stringify(myList));
    }
  }
  renderList();
})
listContainer.addEventListener('click', (e) => {
  const target = e.target;
  const code = target.dataset.code;
  console.log(e.target, code)
  const myString = localStorage.getItem(MY_LIST);
  const myList = myString ? JSON.parse(myString) : [];

  const newList = myList.filter(it => it.code !== code);
  localStorage.setItem(MY_LIST, JSON.stringify(newList));

  renderList();
})

getCodeList();
renderList();
