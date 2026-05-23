
const ADMIN_EMAIL="admin@mellringecafe.se", ADMIN_USERNAME="admin", ADMIN_PASSWORD="Mellringe2025!";
const keys={auth:"mellringe_admin_logged_in",menu:"mellringe_menu_data",settings:"mellringe_site_settings",gallery:"mellringe_gallery_data"};
const defaultMenuData=[{"title": "Varma drycker", "icon": "☕", "image": "images/drinks.jpg", "items": [["Bryggkaffe", "15/20 kr"], ["Te", "15/20 kr"], ["Grönt te", "15/20 kr"], ["Chai Latte Kaffe", "20/25 kr"], ["Cappuccino", "20/25 kr"], ["Latte Macchiato", "25/30 kr"], ["Kaffe med mjölk", "20/30 kr"], ["Varm choklad", "25/30 kr"], ["Latte", "25/30 kr"], ["Espresso Macchiato", "25/30 kr"]]}, {"title": "Kalla drycker", "icon": "🥤", "image": "images/drinks.jpg", "items": [["Läsk", "15 kr"], ["Ayran", "15 kr"], ["Loka", "15 kr"], ["Juice", "15 kr"], ["Red Bull", "25 kr"]]}, {"title": "Bakelser", "icon": "🍰", "image": "images/pastries.jpg", "items": [["Kokoskaka", "12 kr"], ["Morotskaka", "15 kr"], ["Chokladboll", "10 kr"], ["Choklad", "15 kr"], ["Croissant", "15 kr"], ["Croissant med choklad", "35 kr"], ["Croissant med pistage", "35 kr"]]}, {"title": "Manakish och bröd", "icon": "🥐", "image": "images/manakish.jpg", "items": [["Zaatar", "20 kr"], ["Ost", "25 kr"], ["Grönsaker", "30 kr"], ["Kyckling", "30 kr"], ["Ost burak", "29 kr"], ["Fatayer kött", "29 kr"], ["Bröd 400 g", "15 kr"]]}, {"title": "Falafel", "icon": "🧆", "image": "images/falafel-wrap.jpg", "items": [["Falafelrulle", "60 kr"], ["Falafel med bröd", "60 kr"], ["Falafelsnacks", "55 kr"], ["Falafelsallad", "75 kr"]]}, {"title": "Veg", "icon": "🌿", "image": "images/dolma.jpg", "items": [["Dolma tallrik", "119 kr"]]}, {"title": "Såser", "icon": "🥣", "image": "images/hummus.jpg", "items": [["Tsatsiki", "10 kr"], ["Vitlökssås", "10 kr"], ["Yoghurtsås", "10 kr"], ["Rhode Island", "10 kr"]]}, {"title": "Smörgåsar", "icon": "🥪", "image": "images/sandwich.jpg", "price": "Från 35 kr", "items": [["Kycklingsmörgås", "45 kr"], ["Grönsakssmörgås", "35 kr"]], "note": "Färska smörgåsar. Fråga caféet om dagens sortiment."}, {"title": "Meze, sallader & röror", "icon": "🥗", "image": "images/cat-meze.png", "items": [["Fattoush", "80 kr / 800 g"], ["Tabbouleh", "80 kr / 600 g"], ["Bulgur", "70 kr / 700 g"], ["Hummus", "25 kr / 250 g"], ["Mutabbal", "30 kr / 250 g"], ["Muhammara", "20 kr"]], "note": "Färska kalla rätter. Kontakta caféet om större beställningar."}];
const defaultSettings={"cafeName": "Mellringe Café", "heroTitle": "Mellringe Café", "heroSubtitle": "Färska bakverk, nybryggt kaffe, traditionell manakish, krispig falafel och smakrika smörgåsar – mitt i Örebro.", "aboutText": "Mellringe Café är ett lokalt café i Örebro som erbjuder färska bakelser, varma och kalla drycker, manakish, falafel, smörgåsar och andra goda rätter. Vi tar även emot stora beställningar och tårtor finns vid beställning.", "address": "Irisgatan 80, 70353 Örebro", "phone": "0707319710", "phoneDisplay": "0707 31 97 10", "instagram": "@mellringecafee", "tiktok": "@mellringecaf"};
const defaultGallery=[{"title": "Falafelrulle", "image": "images/falafel-wrap.jpg"}, {"title": "Bakelser", "image": "images/pastries.jpg"}, {"title": "Manakish", "image": "images/manakish.jpg"}, {"title": "Bröd", "image": "images/mini-pies.jpg"}, {"title": "Dolma", "image": "images/dolma.jpg"}, {"title": "Dessert", "image": "images/cake.jpg"}, {"title": "Tabbouleh", "image": "images/tabbouleh.jpg"}, {"title": "Bulgur", "image": "images/bulgur.jpg"}, {"title": "Hummus", "image": "images/hummus.jpg"}, {"title": "Mutabbal", "image": "images/mutabbal.jpg"}];
let menuData=read(keys.menu,defaultMenuData), settings=read(keys.settings,defaultSettings), gallery=read(keys.gallery,defaultGallery);

function clone(x){return JSON.parse(JSON.stringify(x))}
function read(k,f){try{const v=localStorage.getItem(k);return v?JSON.parse(v):clone(f)}catch{return clone(f)}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
function esc(s){return String(s??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;")}
function logged(){return localStorage.getItem(keys.auth)==="true"}
function showApp(){loginScreen.classList.add("hidden");adminApp.classList.remove("hidden");renderAll()}
function showLogin(){loginScreen.classList.remove("hidden");adminApp.classList.add("hidden")}
logged()?showApp():showLogin();

loginForm.addEventListener("submit",e=>{e.preventDefault();const u=loginUser.value.trim().toLowerCase();if((u===ADMIN_EMAIL||u===ADMIN_USERNAME)&&loginPassword.value===ADMIN_PASSWORD){localStorage.setItem(keys.auth,"true");showApp()}else loginError.textContent="Fel email/användarnamn eller lösenord."});
logoutBtn.onclick=()=>{localStorage.removeItem(keys.auth);showLogin()};

document.querySelectorAll(".tab[data-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab[data-tab]").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.getElementById(b.dataset.tab).classList.add("active");pageTitle.textContent=b.textContent});

function renderAll(){renderStats();renderMenuEditor();renderGalleryEditor();renderSettings()}
function renderStats(){categoryCount.textContent=menuData.length;itemCount.textContent=menuData.reduce((s,c)=>s+c.items.length,0);galleryCount.textContent=gallery.length}

function renderMenuEditor(){
 categoryEditor.innerHTML="";
 menuData.forEach((cat,ci)=>{
  const card=document.createElement("article");card.className="editor-card";
  card.innerHTML=`<div class="editor-card-head"><div><input class="ct" value="${esc(cat.title)}" placeholder="Kategori"><input class="ci" value="${esc(cat.icon||"")}" placeholder="Icon"></div><button class="delete dc">Ta bort</button></div>
  <label>Pris-text (t.ex. Från 15 kr)<input class="pr" value="${esc(cat.price||"")}" placeholder="Från 15 kr"></label>
  <label>Bild URL/sökväg<input class="im" value="${esc(cat.image||"")}" placeholder="images/tabbouleh.jpg"></label>
  <label>Notering<textarea class="no" rows="2">${esc(cat.note||"")}</textarea></label>
  <div class="item-tools"><strong>Artiklar</strong><button class="small add">+ Lägg till artikel</button></div><div class="items-list"></div>`;
  card.querySelector(".ct").oninput=e=>{cat.title=e.target.value;save(keys.menu,menuData)};
  card.querySelector(".ci").oninput=e=>{cat.icon=e.target.value;save(keys.menu,menuData)};
  card.querySelector(".pr").oninput=e=>{cat.price=e.target.value;save(keys.menu,menuData)};
  card.querySelector(".im").oninput=e=>{cat.image=e.target.value;save(keys.menu,menuData)};
  card.querySelector(".no").oninput=e=>{cat.note=e.target.value;save(keys.menu,menuData)};
  card.querySelector(".dc").onclick=()=>{if(confirm("Ta bort kategori?")){menuData.splice(ci,1);save(keys.menu,menuData);renderAll()}};
  card.querySelector(".add").onclick=()=>{cat.items.push(["Ny artikel","0 kr"]);save(keys.menu,menuData);renderAll()};
  const list=card.querySelector(".items-list");
  cat.items.forEach((it,ii)=>{
   const row=document.createElement("div");row.className="item-row";
   row.innerHTML=`<input value="${esc(it[0])}" placeholder="Namn"><input value="${esc(it[1])}" placeholder="Pris"><button class="delete">×</button>`;
   row.children[0].oninput=e=>{it[0]=e.target.value;save(keys.menu,menuData);renderStats()};
   row.children[1].oninput=e=>{it[1]=e.target.value;save(keys.menu,menuData);renderStats()};
   row.children[2].onclick=()=>{cat.items.splice(ii,1);save(keys.menu,menuData);renderAll()};
   list.appendChild(row);
  });
  categoryEditor.appendChild(card);
 });
}
addCategoryBtn.onclick=()=>{menuData.push({title:"Ny kategori",icon:"🍽️",image:"",items:[["Ny artikel","0 kr"]],note:""});save(keys.menu,menuData);renderAll()};

function renderGalleryEditor(){
 galleryEditor.innerHTML="";
 gallery.forEach((g,i)=>{
  const card=document.createElement("article");card.className="gallery-card";
  card.innerHTML=`<img src="${esc(g.image)}" onerror="this.src='images/logo.svg'"><label>Titel<input value="${esc(g.title)}"></label><label>Bild URL/sökväg<input value="${esc(g.image)}"></label><button class="delete">Ta bort</button>`;
  card.querySelectorAll("input")[0].oninput=e=>{g.title=e.target.value;save(keys.gallery,gallery)};
  card.querySelectorAll("input")[1].onchange=e=>{g.image=e.target.value;save(keys.gallery,gallery);renderGalleryEditor()};
  card.querySelector(".delete").onclick=()=>{gallery.splice(i,1);save(keys.gallery,gallery);renderAll()};
  galleryEditor.appendChild(card);
 });
}
addGalleryBtn.onclick=()=>{gallery.push({title:"Ny bild",image:"images/logo.svg"});save(keys.gallery,gallery);renderAll()};

function renderSettings(){Object.entries(settings).forEach(([k,v])=>{if(settingsForm.elements[k])settingsForm.elements[k].value=v})}
settingsForm.onsubmit=e=>{e.preventDefault();settings=Object.fromEntries(new FormData(settingsForm).entries());save(keys.settings,settings);alert("Sparat. Öppna startsidan för att se ändringarna.")};
resetBtn.onclick=()=>{if(confirm("Återställ demo-data?")){menuData=clone(defaultMenuData);settings=clone(defaultSettings);gallery=clone(defaultGallery);save(keys.menu,menuData);save(keys.settings,settings);save(keys.gallery,gallery);renderAll()}};
exportBtn.onclick=()=>{const blob=new Blob([JSON.stringify({menuData,settings,gallery,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="mellringe-cafe-data.json";a.click()};
