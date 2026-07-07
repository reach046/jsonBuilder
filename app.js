// app.js

let schema = [];
let tableData = [];

// DOM Elements
const propNameInput = document.getElementById('prop-name');
const propTypeSelect = document.getElementById('prop-type');
const addPropBtn = document.getElementById('add-prop-btn');
const schemaBody = document.getElementById('schema-body');

const subschemaBuilder = document.getElementById('subschema-builder');
const subschemaList = document.getElementById('subschema-list');
const addSubpropBtn = document.getElementById('add-subprop-btn');

const dataThead = document.getElementById('data-thead');
const dataTbody = document.getElementById('data-tbody');
const addRowBtn = document.getElementById('add-row-btn');
const clearDataBtn = document.getElementById('clear-data-btn');

const fileExtensionInput = document.getElementById('file-extension');
const exportZipBtn = document.getElementById('export-zip-btn');


// --- UI Events ---
propTypeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'array-object') {
        subschemaBuilder.style.display = 'block';
        if (subschemaList.children.length === 0) {
            createSubpropItem(); // add at least one
        }
    } else {
        subschemaBuilder.style.display = 'none';
    }
});

addSubpropBtn.addEventListener('click', createSubpropItem);

function createSubpropItem() {
    const div = document.createElement('div');
    div.className = 'sub-prop-item';
    div.innerHTML = `
        <input type="text" placeholder="속성명 (예: itemId)" class="sub-prop-name">
        <select class="sub-prop-type">
            <option value="string">문자열</option>
            <option value="number">숫자</option>
            <option value="boolean">참/거짓</option>
        </select>
        <button type="button" class="btn danger small" onclick="this.parentElement.remove()">X</button>
    `;
    subschemaList.appendChild(div);
}

// --- Schema Management ---
function addProperty() {
    const name = propNameInput.value.trim();
    const type = propTypeSelect.value;

    if (!name) {
        alert('속성 이름을 입력해주세요.');
        return;
    }

    if (schema.some(prop => prop.name === name)) {
        alert('이미 존재하는 속성 이름입니다.');
        return;
    }

    let subSchema = null;
    if (type === 'array-object') {
        const items = subschemaList.querySelectorAll('.sub-prop-item');
        if (items.length === 0) {
            alert('최소 1개의 하위 속성을 정의해야 합니다.');
            return;
        }
        subSchema = [];
        let valid = true;
        items.forEach(item => {
            const subName = item.querySelector('.sub-prop-name').value.trim();
            const subType = item.querySelector('.sub-prop-type').value;
            if(!subName) valid = false;
            subSchema.push({ name: subName, type: subType });
        });
        
        if (!valid) {
            alert('모든 하위 속성명을 입력해주세요.');
            return;
        }
    }

    schema.push({ name, type, subSchema });
    
    if (schema.length === 1 && tableData.length === 0) {
        tableData.push({});
    }

    // Reset UI
    propNameInput.value = '';
    propTypeSelect.value = 'string';
    subschemaBuilder.style.display = 'none';
    subschemaList.innerHTML = '';
    propNameInput.focus();
    
    renderSchema();
    renderTable();
}

function removeProperty(index) {
    const propName = schema[index].name;
    schema.splice(index, 1);
    
    tableData.forEach(row => {
        delete row[propName];
    });

    renderSchema();
    renderTable();
}

function renderSchema() {
    schemaBody.innerHTML = '';
    schema.forEach((prop, index) => {
        const tr = document.createElement('tr');
        
        let typeLabel = '';
        if(prop.type === 'string') typeLabel = '문자열 (String)';
        if(prop.type === 'number') typeLabel = '숫자 (Number)';
        if(prop.type === 'boolean') typeLabel = '참/거짓 (Boolean)';
        if(prop.type === 'array-string') typeLabel = '문자열 배열 (A, B)';
        if(prop.type === 'array-number') typeLabel = '숫자 배열 (1, 2)';
        if(prop.type === 'array-object') {
            const subStr = prop.subSchema.map(s => `${s.name}:${s.type}`).join(', ');
            typeLabel = `객체 배열 <br><span style="font-size:0.8rem;color:var(--text-muted)">{${subStr}}</span>`;
        }

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${prop.name}</strong> ${index === 0 ? '<span style="color:var(--primary-color); font-size:0.8rem;">(파일명 기준)</span>' : ''}</td>
            <td>${typeLabel}</td>
            <td class="text-right">
                <button class="btn danger small" onclick="removeProperty(${index})">삭제</button>
            </td>
        `;
        schemaBody.appendChild(tr);
    });
}

// --- Data Table Management ---
function renderTable() {
    dataThead.innerHTML = '';
    if (schema.length === 0) {
        dataThead.innerHTML = '<tr><th>속성을 먼저 추가해주세요.</th></tr>';
        dataTbody.innerHTML = '';
        return;
    }

    const trHead = document.createElement('tr');
    trHead.innerHTML = `<th>#</th>`;
    schema.forEach(prop => {
        trHead.innerHTML += `<th>${prop.name}</th>`;
    });
    trHead.innerHTML += `<th class="text-right">작업</th>`;
    dataThead.appendChild(trHead);

    dataTbody.innerHTML = '';
    tableData.forEach((row, rowIndex) => {
        const trBody = document.createElement('tr');
        
        let tdNum = document.createElement('td');
        tdNum.textContent = rowIndex + 1;
        trBody.appendChild(tdNum);

        schema.forEach(prop => {
            const td = document.createElement('td');
            if (prop.type === 'boolean') {
                if(row[prop.name] === undefined) row[prop.name] = false;
                const label = document.createElement('label');
                label.className = 'custom-checkbox';
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = row[prop.name];
                input.onchange = (e) => updateData(rowIndex, prop.name, e.target.checked);
                label.appendChild(input);
                td.appendChild(label);
            } else if (prop.type === 'array-object') {
                if(row[prop.name] === undefined) row[prop.name] = [];
                
                // Create inline nested table
                const container = document.createElement('div');
                container.className = 'nested-table-container';

                if (row[prop.name].length > 0) {
                    const nTable = document.createElement('table');
                    nTable.className = 'nested-table';
                    
                    const nThead = document.createElement('thead');
                    const nTrHead = document.createElement('tr');
                    prop.subSchema.forEach(sp => {
                        const th = document.createElement('th');
                        th.textContent = sp.name;
                        nTrHead.appendChild(th);
                    });
                    const thActions = document.createElement('th');
                    nTrHead.appendChild(thActions);
                    nThead.appendChild(nTrHead);
                    nTable.appendChild(nThead);

                    const nTbody = document.createElement('tbody');
                    row[prop.name].forEach((subRow, subIndex) => {
                        const nTrBody = document.createElement('tr');
                        prop.subSchema.forEach(sp => {
                            const nTd = document.createElement('td');
                            if (sp.type === 'boolean') {
                                if(subRow[sp.name] === undefined) subRow[sp.name] = false;
                                const label = document.createElement('label');
                                label.className = 'custom-checkbox';
                                const input = document.createElement('input');
                                input.type = 'checkbox';
                                input.checked = subRow[sp.name];
                                input.onchange = (e) => {
                                    subRow[sp.name] = e.target.checked;
                                };
                                label.appendChild(input);
                                nTd.appendChild(label);
                            } else {
                                const input = document.createElement('input');
                                input.type = sp.type === 'number' ? 'number' : 'text';
                                input.value = subRow[sp.name] !== undefined ? subRow[sp.name] : '';
                                input.oninput = (e) => {
                                    let val = e.target.value;
                                    if(sp.type === 'number') val = val === '' ? '' : Number(val);
                                    subRow[sp.name] = val;
                                };
                                nTd.appendChild(input);
                            }
                            nTrBody.appendChild(nTd);
                        });
                        
                        const tdActions = document.createElement('td');
                        tdActions.className = 'text-right';
                        const delBtn = document.createElement('button');
                        delBtn.className = 'btn danger small';
                        delBtn.textContent = 'X';
                        delBtn.onclick = () => {
                            row[prop.name].splice(subIndex, 1);
                            renderTable();
                        };
                        tdActions.appendChild(delBtn);
                        nTrBody.appendChild(tdActions);
                        nTbody.appendChild(nTrBody);
                    });
                    nTable.appendChild(nTbody);
                    container.appendChild(nTable);
                }

                const addBtn = document.createElement('button');
                addBtn.className = 'btn secondary small';
                addBtn.textContent = '+ 항목 추가';
                addBtn.onclick = () => {
                    const newSubRow = {};
                    prop.subSchema.forEach(sp => {
                        if(sp.type === 'boolean') newSubRow[sp.name] = false;
                        else if(sp.type === 'number') newSubRow[sp.name] = 0;
                        else newSubRow[sp.name] = '';
                    });
                    row[prop.name].push(newSubRow);
                    renderTable();
                };
                container.appendChild(addBtn);
                td.appendChild(container);
                
            } else if (prop.type.startsWith('array')) {
                const input = document.createElement('input');
                input.type = 'text';
                input.placeholder = '쉼표(,)로 구분';
                input.value = Array.isArray(row[prop.name]) ? row[prop.name].join(', ') : '';
                input.oninput = (e) => {
                    let valStr = e.target.value;
                    let arr = valStr.split(',').map(s => s.trim()).filter(s => s !== '');
                    if (prop.type === 'array-number') {
                        arr = arr.map(s => isNaN(Number(s)) ? 0 : Number(s));
                    }
                    updateData(rowIndex, prop.name, arr);
                };
                td.appendChild(input);
                if(row[prop.name] === undefined) row[prop.name] = [];
            } else {
                const input = document.createElement('input');
                input.type = prop.type === 'number' ? 'number' : 'text';
                input.value = row[prop.name] !== undefined ? row[prop.name] : '';
                input.oninput = (e) => {
                    let val = e.target.value;
                    if(prop.type === 'number') val = val === '' ? '' : Number(val);
                    updateData(rowIndex, prop.name, val);
                };
                td.appendChild(input);
            }
            trBody.appendChild(td);
        });

        const tdActions = document.createElement('td');
        tdActions.className = 'text-right';
        tdActions.innerHTML = `
            <button class="btn danger small" onclick="removeRow(${rowIndex})">삭제</button>
            <button class="download-item-btn" onclick="downloadSingle(${rowIndex})">개별 추출</button>
        `;
        trBody.appendChild(tdActions);

        dataTbody.appendChild(trBody);
    });
}

function updateData(rowIndex, propName, value) {
    tableData[rowIndex][propName] = value;
}

function addRow() {
    if (schema.length === 0) {
        alert('구조를 먼저 정의해주세요.');
        return;
    }
    const newRow = {};
    schema.forEach(prop => {
        if(prop.type === 'boolean') newRow[prop.name] = false;
        else if(prop.type === 'string') newRow[prop.name] = '';
        else if(prop.type === 'number') newRow[prop.name] = 0;
        else if(prop.type.startsWith('array')) newRow[prop.name] = [];
    });
    tableData.push(newRow);
    renderTable();
}

function removeRow(index) {
    tableData.splice(index, 1);
    renderTable();
}

function clearData() {
    if(confirm('모든 입력 데이터를 삭제하시겠습니까? (구조는 유지됩니다)')) {
        tableData = [];
        renderTable();
    }
}


// --- Export Management ---
function getFileNameForRow(row) {
    let ext = fileExtensionInput.value.trim() || '.json';
    if (!ext.startsWith('.')) ext = '.' + ext;

    if (schema.length > 0) {
        const firstPropName = schema[0].name;
        let baseName = row[firstPropName];
        if (baseName === undefined || baseName === null || baseName === '') {
            baseName = 'untitled';
        }
        return `${baseName}${ext}`;
    }
    return `data${ext}`;
}

function generateJSONContent(row) {
    return JSON.stringify(row, null, 2);
}

function downloadSingle(rowIndex) {
    const row = tableData[rowIndex];
    const filename = getFileNameForRow(row);
    const content = generateJSONContent(row);
    
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function exportZip() {
    if (tableData.length === 0) {
        alert('추출할 데이터가 없습니다.');
        return;
    }

    const zip = new JSZip();
    
    tableData.forEach((row, index) => {
        const filename = getFileNameForRow(row);
        const content = generateJSONContent(row);
        
        let finalFilename = filename;
        let counter = 1;
        while(zip.file(finalFilename)) {
            const parts = filename.split('.');
            const ext = '.' + parts.pop();
            const base = parts.join('.');
            finalFilename = `${base}_${counter}${ext}`;
            counter++;
        }
        
        zip.file(finalFilename, content);
    });

    zip.generateAsync({ type: 'blob' }).then(function(content) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = 'game_data_bulk.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}

// Event Listeners
addPropBtn.addEventListener('click', addProperty);
propNameInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') addProperty();
});

addRowBtn.addEventListener('click', addRow);
clearDataBtn.addEventListener('click', clearData);
exportZipBtn.addEventListener('click', exportZip);

// Init
renderSchema();
renderTable();

// --- Resizer Logic ---
const resizerElement = document.getElementById('sidebar-resizer');
const sidebarLeft = document.querySelector('.sidebar-left');
let isResizing = false;
let startX;
let startWidth;

resizerElement.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startWidth = sidebarLeft.getBoundingClientRect().width;
    
    document.body.style.cursor = 'col-resize';
    sidebarLeft.style.userSelect = 'none';
    sidebarLeft.style.pointerEvents = 'none';
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const dx = e.clientX - startX;
    const newWidth = Math.max(250, startWidth + dx); // Minimum width 250px
    sidebarLeft.style.width = `${newWidth}px`;
});

document.addEventListener('mouseup', () => {
    if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
        sidebarLeft.style.userSelect = '';
        sidebarLeft.style.pointerEvents = '';
    }
});

// --- Supabase Cloud Integration ---
const SUPABASE_URL = 'https://bslzltjpllptynhadceh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzbHpsdGpwbGxwdHluaGFkY2VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MzM5ODAsImV4cCI6MjA5OTAwOTk4MH0.Lw18UtgFlZeeqFSnIlOYDlOCt3CeWZeIgFzHzq99Dso';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const cloudSaveBtn = document.getElementById('cloud-save-btn');
const cloudLoadBtn = document.getElementById('cloud-load-btn');
const cloudModal = document.getElementById('cloud-modal');
const closeCloudModalBtn = document.getElementById('close-cloud-modal-btn');
const projectListBody = document.getElementById('project-list-body');

cloudSaveBtn.addEventListener('click', async () => {
    if (schema.length === 0) {
        alert('저장할 데이터 구조가 없습니다.');
        return;
    }

    const projectName = prompt('저장할 프로젝트 이름을 입력하세요:', '새 프로젝트');
    if (!projectName) return;

    cloudSaveBtn.textContent = '저장 중...';
    cloudSaveBtn.disabled = true;

    try {
        const { error } = await supabaseClient
            .from('game_data_projects')
            .insert([
                { 
                    project_name: projectName,
                    schema_json: schema,
                    data_json: tableData
                }
            ]);

        if (error) throw error;
        alert(`'${projectName}' 프로젝트가 클라우드에 성공적으로 저장되었습니다!`);
    } catch (err) {
        console.error(err);
        alert('클라우드 저장 실패: ' + err.message);
    } finally {
        cloudSaveBtn.textContent = '클라우드 저장';
        cloudSaveBtn.disabled = false;
    }
});

cloudLoadBtn.addEventListener('click', async () => {
    cloudModal.classList.add('show');
    await fetchProjects();
});

closeCloudModalBtn.addEventListener('click', () => {
    cloudModal.classList.remove('show');
});

async function fetchProjects() {
    projectListBody.innerHTML = '<tr><td colspan="3">불러오는 중...</td></tr>';
    
    try {
        const { data, error } = await supabaseClient
            .from('game_data_projects')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        projectListBody.innerHTML = '';
        if (data.length === 0) {
            projectListBody.innerHTML = '<tr><td colspan="3">저장된 프로젝트가 없습니다.</td></tr>';
            return;
        }

        data.forEach(project => {
            const tr = document.createElement('tr');
            
            const tdName = document.createElement('td');
            tdName.textContent = project.project_name;
            tr.appendChild(tdName);
            
            const tdDate = document.createElement('td');
            tdDate.textContent = new Date(project.created_at).toLocaleString();
            tr.appendChild(tdDate);
            
            const tdAction = document.createElement('td');
            tdAction.className = 'text-right';
            const loadBtn = document.createElement('button');
            loadBtn.className = 'btn secondary small';
            loadBtn.textContent = '불러오기';
            loadBtn.onclick = () => loadProject(project);
            tdAction.appendChild(loadBtn);
            
            const delBtn = document.createElement('button');
            delBtn.className = 'btn danger small';
            delBtn.textContent = '삭제';
            delBtn.style.marginLeft = '8px';
            delBtn.onclick = () => deleteProject(project.id);
            tdAction.appendChild(delBtn);
            
            tr.appendChild(tdAction);
            projectListBody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        projectListBody.innerHTML = `<tr><td colspan="3" style="color:red;">에러: ${err.message}</td></tr>`;
    }
}

function loadProject(project) {
    if(!confirm(`'${project.project_name}' 프로젝트를 불러오시겠습니까? 현재 작성 중인 내용은 모두 사라집니다.`)) return;
    
    schema = project.schema_json || [];
    tableData = project.data_json || [];
    
    renderSchema();
    renderTable();
    
    cloudModal.classList.remove('show');
    alert('프로젝트를 성공적으로 불러왔습니다.');
}

async function deleteProject(id) {
    if(!confirm('정말 이 프로젝트를 삭제하시겠습니까? (복구 불가)')) return;
    
    try {
        const { error } = await supabaseClient
            .from('game_data_projects')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        fetchProjects(); // refresh list
    } catch (err) {
        console.error(err);
        alert('삭제 실패: ' + err.message);
    }
}
