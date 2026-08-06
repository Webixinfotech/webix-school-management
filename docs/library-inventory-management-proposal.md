# INVENTORY & LIBRARY MANAGEMENT MODULE

## Project Proposal & Feature Document

**Pre-School / Daycare Management System ke liye taiyar kiya gaya**

> Har item ko track karne ke liye ek simple, transparent system — aane se lekar use hone, issue hone, udhaar jaane ya bikne tak.

**Project:** Brain Builder International — Backend API (`brainbuilder_backend`)
**Module:** Inventory & Library (single unified module)
**Document Version:** 4.0 — Final
**Status:** Draft for client review

---

## 1. Introduction

Har din ek pre-school / daycare mein bahut saari physical items use hoti hain — toys, books, stationery, craft material, uniform, school bag, gift items, aur bhi bahut kuch. Time ke saath naye-naye tarah ke items add hote rehte hain, isliye pehle se har cheez ki list bana pana possible nahi hai.

Abhi koi ek jagah nahi hai jahan ye dekha ja sake ki kya andar aaya, kya bahar gaya, kiske paas kya hai, aur kis cheez ka stock kam ho raha hai. Isi problem ko solve karne ke liye ek hi module banaya ja raha hai — **Inventory & Library Management** — jahan har item, chahe kitna bhi chota ya bada ho, uske aane se lekar use hone, issue hone, udhaar jaane, bikne ya wapas aane tak har stage par record hoga.

**Library alag system nahi hai** — books aur padhne-se-judi cheezein bhi inventory ki hi ek item category hain, jinke liye lending (borrow/return) ka wohi flow use hota hai jo toys ya kisi bhi doosri "udhaar di jaane wali" item ke liye banaya ja raha hai. Isliye dono ko ek hi document, ek hi system, aur ek hi Admin panel ke andar rakha ja raha hai.

Ye pura module ek hi go mein — bina kisi "abhi ye milega, baad mein wo milega" wale split ke — banaya jaa raha hai, taaki launch se hi ek complete, ready-to-use system mile.

Ye document simple bhasha mein batata hai ki ye module kya karega, har hissa kaise kaam karega, aur sab kuch aapas mein kaise connected hai — taaki development shuru hone se pehle poori tasveer clear aur approved ho jaye.

---

## 2. Objective

Is module ka objective hai school ke Admin (aur unke trusted staff) ko school ki har item — including library books — par poori visibility aur control dena, bina kisi manual register ya alag Excel sheet ke. Specifically, ye module:

- Har item ko record karega jo school mein aati hai — chahe kitni bhi choti ho, ya ek book hi kyu na ho — quantity, date aur source ke saath.
- Har item ko track karega jo store se bahar jaati hai — kisko mili, kitni quantity mein, aur kab.
- Special cases ko handle karega, jaise parents ko fixed time ke liye di gayi books/toys, saath mein automatic reminder — yehi library ka core kaam hai.
- Admin ko pehle se alert karega jab koi item khatam hone wali ho.
- Har teacher ya parent ko apne panel par apni khud ki item history dekhne dega — Admin se poochne ki zaroorat nahi.
- Ek saath bahut saari items add karne ke liye ready Excel template use karne dega.
- Kuch items ko school ki public page par bhi dikha payega, aur parents ko unme se apni pasand ki cheezein **wishlist** karne dega.
- Kisi bhi item ya poori item category ko class-wise **free ya chargeable** set karne dega.
- Ye ensure karega ki koi bhi item **bikne ke liye tabhi available ho jab Admin khud use explicitly ON kare** — by default kuch bhi sale ke liye nahi khula rehta.
- Rented/borrowed items ke liye ek **safety check** rakhega, taaki koi bhi item uski value se kam security deposit par galti se issue na ho jaaye.
- **Bahar ke logon ko bhi (jo abhi school mein admitted nahi hain) seedha Student ke roop mein convert karke access de payega — bina koi alag public signup system banaye**, existing Enquiry process ko hi reuse karke (Section 5 mein detail).
- Admin ko Library aur Inventory, dono ke liye **alag-alag, category-wise permissions** delegate karne dega — aur ye permission ek poori category ke liye ya ek single item ke liye bhi di ja sake (Section 4.3, 4.11).

---

## 3. Kis Tarah Ki Items Cover Hongi

Chunki items alag-alag tarah ki hoti hain, module inhe teen simple categories mein baantta hai. Ye grouping decide karti hai ki system us item ke liye kaise behave karega:

- **Consumable items** — ek baar use hokar khatam ho jaati hain, wapas nahi aati. Example: pencil, chart paper, glue, marker.
- **Returnable / Lendable items** — kuch time ke liye di jaati hain aur wapas aane ki expectation hoti hai. Example: **books**, toys, sports equipment. *(Library effectively yahi category hai.)*
- **Sellable items** — parents ke dwara khareedi jaati hain, sirf tab jab Admin unhe "Available for Sale" mark kare (Section 4.5). Example: uniform, school bag, T-shirt, gift items, aur wo books jo hamesha ke liye kharidi jaati hain.

Ek hi item ek se zyada category mein bhi aa sakti hai — jaise koi book kuch dino ke liye udhaar bhi li ja sakti hai (Returnable) aur hamesha ke liye khareedi bhi ja sakti hai (Sellable, agar Admin ne ise available-for-sale kiya ho).

---

## 4. Key Features

### 4.1 Item Master — Har Item Ka Ek Record

Har item ka apna record banega jisme: naam, category (Toys, Books, Stationery, Uniform, etc.), quantity ki unit (piece, packet, box), current stock, minimum stock level (low-stock alert ke liye), storage location, photo, vendor/supplier details, **selling/replacement price**, aur — agar item lendable hai — uska **security deposit amount** bhi shaamil hoga. Available-for-Sale (4.5) aur class-wise free/chargeable (4.6) settings bhi isi item record ka hissa hain.

*Example:* "Marker – Blue" naam ki item ka record banega — category: Stationery, unit: piece, minimum stock: 20, taaki jab stock 20 se neeche jaaye to alert mil jaaye.

*Fayda:* Kuch bhi pehle se tay ya list karne ki zaroorat nahi. Koi bhi nayi tarah ki item — chahe kitni bhi unusual ho — aane par aasani se add ki ja sakti hai.

> **Note (books ke liye):** Books bhi baaki items ki tarah **quantity ke hisaab se** track hoti hain (e.g. "Panchatantra Stories – 8 copies available"). Agar zaroorat ho, to har individual copy ko uske apne accession/barcode number se alag-alag track karna bhi possible hai — ye ek **optional, per-item setting** hai, Admin jis book ke liye chahe wahi ON kar sakta hai.

### 4.2 Stock In — Jo Andar Aaya Use Record Karna

Jab bhi naya stock aata hai, Admin (ya permission-prapt staff) record karta hai: kitne packet/box aaye, har packet mein kitne piece hain, date, vendor, aur bill/invoice agar ho. Entry save hote hi stock apne aap update ho jaata hai.

*Example:* Story books ka ek carton aaya, jisme 10 packets hain aur har packet mein 5 books hain — entry karte hi stock mein 50 books add ho jaayengi, saath mein vendor ka naam aur bill number bhi record hoga.

*Fayda:* Har item ki date-wise purchase history saaf milegi — budget banane mein aur "ye kab aaya tha" jaise sawaal ko turant solve karne mein kaam aayegi.

### 4.3 Stock Out / Issue — Jo Bahar Gaya Use Record Karna

Jab bhi koi item kisi teacher, class ko di jaaye ya daily kaam mein use ho, wo ek simple step mein record hoti hai: item select karo, kisko di ja rahi hai wo select karo, quantity daalo, aur save karo.

**By default, har item ke liye Admin ki approval required hoti hai** — teacher pehle ek request bhejti hai, Admin approve karta hai, tabhi item issue hoti hai. Admin chahe to kisi item ko is approval-requirement se **exempt** kar sakta hai, taaki wo teacher seedha, bina Admin approval ke, issue kar sake. Ye exemption do level par di ja sakti hai:

- **Poori category ke liye** — jaise saari "Books" category ko direct-issue ke liye enable kar dena.
- **Single item ke liye** — jaise sirf "Pencil" aur "Eraser" ko individually direct-issue enable karna, baaki stationery approval hi maangti rahe.

*Example:* Admin ne "Pencil" aur "Eraser" ko direct-issue ke liye enable kar diya hai — teacher inhe kabhi bhi seedha issue kar sakti hai, bina wait kiye. Lekin "Sports Equipment" category abhi bhi approval maangti hai — teacher request bhejti hai, Admin approve karta hai, tabhi item issue hoti hai.

*Fayda:* Zyada value/sensitive items par Admin ka control by-default bana rehta hai, jabki roz-marra ki chhoti, trusted cheezein teacher khud fast issue kar sakti hai — bina har baar approval ka wait kiye.

### 4.4 Parents Ko Items Issue Karna — Borrow Ya Buy *(Library ka core)*

Books aur aisi hi lendable items parents ke liye do tariko se handle ki ja sakti hain:

- **Fixed time ke liye borrow** — system issue date aur return-by date record karta hai. Agar item time par wapas nahi aati, to apne aap reminder chala jaata hai (Section 4.12, Alerts).
- **Hamesha ke liye buy** — agar item "Available for Sale" hai (Section 4.5), to ye ek sale ki tarah record hota hai, jo system ke fee/payment side se connect hota hai.

Ek alag "Library module" banane ke bajaye, yehi workflow — jo already Toys/Sports equipment jaise doosre lendable items ke liye ban raha hai — books par bhi seedha apply ho jaata hai.

*Example:* Ek parent apne bacche ke liye 5 July ko ek story book borrow karte hain, return date 12 July tay hoti hai. Agar 12 July tak book wapas nahi aati, to parent ko apne aap reminder chala jaayega.

*Fayda:* Admin ko manually ye yaad rakhne ki zaroorat nahi ki kisne kya borrow kiya aur kab dena hai — system khud track karta hai aur yaad dilata hai.

> **Deposit safety check:** Agar kisi rented/borrowed item ki selling/replacement price uske liye tay **security deposit amount se zyada** hai, to system us item ko **issue hi nahi hone dega** — issue karne wale (teacher/Admin) ko turant ek alert milega. Isse koi bhi mehenga item kam deposit par galti se bahar nahi chala jaata.

### 4.5 Available for Sale

Har item ke liye Admin control karta hai ki wo item bikne ke liye available hai ya nahi — ek simple **"Available for Sale"** switch. **Default hamesha "Not for Sale" rehta hai** — jab tak Admin khud ise ON na kare, koi bhi item purchase ke liye offer nahi hoti.

*Example:* Admin "Summer Uniform Set" ko Available for Sale ON kar deta hai taaki parents ise khareed sakein; lekin "Class Reading Copy" (jo sirf library se borrow hoti hai, bikti nahi) ke liye ye OFF hi rehta hai.

*Fayda:* Koi bhi item galti se bikne ke liye available nahi ho jaati — Admin ko har cheez explicitly, ek-ek karke, sale ke liye enable karni padti hai.

### 4.6 Class-wise Free / Chargeable Access

Har item — ya poori item category — ke liye Admin ye decide kar sakta hai ki wo kis class/grade ke liye **free** hai aur kis class ke liye **chargeable**.

Ye setting do level par di ja sakti hai:

- **Single item par** — sirf ek specific item ke liye free-classes select karna.
- **Poori category par** — jaise "Books" category select karke, ek hi baar mein decide kar dena ki ye poori category kin classes ke liye free hai, taaki har book ke paas alag-alag jaakar setting na karni pade.

*Example:* Admin "Books" category ko hi select karke Nursery aur LKG ke liye free kar deta hai — us category ki har book automatically un classes ke liye free ho jaati hai. Agar koi ek specific book (jaise ek premium encyclopedia) is general rule se alag rakhni ho, to Admin usi ek item par apni khud ki setting bhi de sakta hai, jo category wali setting ko override kar degi.

*Fayda:* Bulk mein bhi kaam ho sakta hai (poori category ek saath) aur zaroorat ho to individual item par bhi fine control mil jaata hai.

### 4.7 Public Page Visibility

Har item ke liye Admin control karta hai ki wo item school ki public-facing page (jaise website/home page) par dikhega ya nahi — aur agar dikhega, to kya-kya info dikhegi (photo, naam, price/availability). Internal-only detail (jaise exact stock quantity, vendor, cost price) hamesha private hi rehte hain, public page par kabhi nahi dikhte.

*Example:* Admin "Summer Uniform Set" ko public page par "available for purchase" ke roop mein dikha sakta hai taaki naye/prospective parents bhi dekh sakein; jabki roz-marra ki stationery items public page par bilkul nahi dikhengi.

*Fayda:* School apni website/public page ko dynamically apne stock ke saath jod sakta hai, bina do jagah alag-alag manage kiye. Jo visitor public page par kisi item ko dekh kar interested ho jaata hai, wo seedha Enquiry submit kar sakta hai (Section 5) — jahan se unhe aage access milta hai.

### 4.8 Wishlist

Parents kisi bhi item ko apni wishlist mein save kar sakte hain — chahe wo abhi available ho ya na ho. Jaise hi wo item stock mein wapas aata hai, wishlist wale user ko apne aap notification chala jaata hai.

*Example:* Ek parent ek particular toy ko wishlist mein daal dete hain jo abhi out of stock hai. Jaise hi Admin uska naya stock in karta hai, us parent ko turant notification milta hai: "Ye item ab available hai."

*Fayda:* Parents ko baar-baar check karte rehne ki zaroorat nahi padti, aur Admin ko ye bhi pata chal jaata hai ki kaunsi items sabse zyada demand mein hain (wishlist count se) — future stock-in decisions mein madad milti hai.

### 4.9 "My Items" — Har Teacher Aur Parent Ke Liye Personal Panel

Jisko bhi koi item di jaati hai — chahe teacher ho ya parent — wo apne aap unke apne panel par dikh jaayegi. Ye personal panel dikhata hai ki kya diya gaya, kitni quantity mein, aur kis date ko — bina Admin se poochhe ya alag register dekhe. Yahi panel parent ki wishlist bhi ek tab mein saath dikhata hai.

*Example:* Ek teacher apna panel khol kar dekh sakti hai: "1 Marker (Blue) — 12 July ko issue kiya gaya." Ek parent apna panel khol kar dekh sakte hain: "Story Book — 5 July ko borrow ki, return 12 July tak" aur saath mein apni wishlist bhi.

*Fayda:* Sabke liye poori transparency — koi confusion nahi, koi dispute nahi, aur Admin ke paas wapas aane wale sawaal bhi kaafi kam ho jaayenge.

### 4.10 Bulk Upload — Ek Saath Kai Items Add Karna

Ek-ek karke items type karne ke bajaye, Admin ek ready Excel template ke zariye ek saath bahut saari items add kar sakta hai:

- System ek downloadable template sheet dega jisme har zaroori field (naam, category, quantity, unit, vendor, etc.) ke liye clear columns bane honge.
- Admin is sheet ko system ke bahar, Excel mein, apni convenience ke hisaab se bhar sakta hai — offline bhi.
- Bhari hui sheet upload karte hi, system apne aap har column ko padh kar har item ki matching field mein bhar dega.
- Kuch bhi final save hone se pehle, uploaded data screen par review ke liye dikhaya jaayega, taaki galat bhari gayi kisi bhi line ko theek kiya ja sake ya hataya ja sake.
- Upload ke baad bhi, har item pura editable rahega — yahan tak ki uski photo bhi alag se update ki ja sakti hai.

*Example:* Ek saath 100 naye stationery items aayi hain. Admin template download karke Excel mein saari detail bhar deta hai, upload karta hai — system review ke liye dikhata hai ki "98 items sahi se padh li gayi, 2 lines mein unit khaali hai" — Admin un 2 lines ko theek karke final save kar deta hai.

*Fayda:* Jo kaam ghanto ki manual typing mein lagta, wo minutes mein ho jaata hai, saath hi final hone se pehle ek safe review step bhi milta hai.

### 4.11 Role & Permission Based Access — Library Aur Inventory Dono Alag-Alag Control Hote Hain

Alag se naya "librarian" ya "store in-charge" role banane ke bajaye, system existing teacher accounts par hi permissions deta hai — lekin ye permissions sirf ek single ON/OFF switch nahi, balki **category-wise granular** hoti hain, taaki Admin bilkul specific control de sake ki kis teacher ko exactly kya karne diya jaa raha hai.

Permissions do groups mein di ja sakti hain:

**Library permissions** *(books/toys jaisi lendable items ke liye)*

| Permission | Kya milta hai |
|---|---|
| Library — Catalog | Naye library items add/edit karna, unki pricing / class-wise free setting, public visibility, available-for-sale set karna |
| Library — Issue & Return | Borrow / buy / return process manage karna |
| Library — Reports | Sirf library se judi reports dekhna |

**Inventory permissions** *(stationery, uniform, consumables jaisi baaki items ke liye)*

| Permission | Kya milta hai |
|---|---|
| Inventory — Stock In | Naya stock record karna |
| Inventory — Stock Out | Teachers/classes ko items issue karna (jahan direct-issue enabled hai) |
| Inventory — Catalog | Item master add/edit karna |
| Inventory — Reports | Sirf inventory se judi reports dekhna |

*Example:* Admin ek teacher ko sirf **Library — Issue & Return** permission deta hai — wo books/toys issue-return kar sakti hai, lekin stationery ka stock nahi manage kar sakti. Ek doosri senior teacher ko sirf **Inventory — Stock In** diya jaata hai — wo naya saaman record kar sakti hai, lekin library ki books issue nahi kar sakti. Chahe to Admin dono groups ki sabhi permissions bhi ek hi teacher ko de sakta hai.

*Fayda:* Admin ko "sabko full access" ya "kisiko bhi access nahi" — in do extremes mein choose nahi karna padta. Bilkul specific, need-based permissions di ja sakti hain, wo bhi bina koi naya complex role-hierarchy banaye. Baaki sabhi teachers ke paas by-default sirf view-only access rehta hai — apni class ko allocate hui items aur apna khud ka "My Items" panel.

### 4.12 Notifications & Alerts

- **Low-stock alert** — jaise hi koi item apne set minimum level se neeche jaaye, turant bhej diya jaata hai.
- **Overdue return alert** — jab kisi borrowed item (book ho ya toy) ki return date nikal jaati hai, to parent ko (aur Admin ko bhi) bheja jaata hai.
- **Upcoming due reminder** — return date se ek-do din pehle ek halka reminder, taaki overdue hone se pehle hi yaad aa jaaye.
- **Wishlist restock alert** — jab wishlist wali koi item wapas stock mein aati hai, jisne wishlist ki thi unhe turant bataya jaata hai.
- **Issue-approval alert** — jab kisi teacher ki issue-request Admin ke approval ka wait kar rahi ho (Section 4.3).
- **Deposit-mismatch alert** — jab koi item deposit se zyada value ki hone ki wajah se issue nahi ho paati (Section 4.4).

*Example:* Marker ka stock 20 se neeche jaakar 15 ho jaata hai — Admin ko turant notification milta hai: "Marker (Blue) ka stock kam hai, dobara order karein."

*Fayda:* Admin ko dus-dus return dates, stock levels ya pending approvals ko manually track nahi karna padta — system khud nazar rakhta hai aur alert karta hai.

### 4.13 Reports & Dashboard

Ek simple dashboard Admin ko ek nazar mein poori tasveer deta hai:

- Total stock value aur category-wise breakdown.
- Filhaal issue/borrow ki gayi items ki list aur overdue list.
- Sabse zyada use/borrow hone wali items, aur sabse zyada wishlist ki gayi items (demand ka signal).
- Stationery aur baaki samaan par month ka expense.

---

## 5. Bahar Ke Log Kaise Judte Hain — Enquiry Se, Seedha Student Ke Roop Mein

Ye is document ka sabse important connecting-piece hai, isliye alag se explain kiya ja raha hai.

Pehle socha gaya tha ki library-only interest wale logon ke liye ek alag **"Library Member"** type banayi jaayegi. **Ye hataya ja raha hai** — simplicity ke liye. System mein ab sirf **ek hi tarah ka conversion hai: Student.**

Chahe koi enquiry poori tarah school admission ke liye ho, ya sirf kuch books/toys borrow/buy karne ke interest se ho, dono hi **wahi Enquiry process reuse karte hain jo abhi admissions ke liye already chal raha hai** (`New → Contacted → Visited → Admitted / Rejected`). Admin jab satisfied ho jaata hai, to usi existing "Convert to Student" action se enquiry ko seedha ek Student record mein convert kar deta hai — koi alag "Library Member" entity maintain nahi karni padti.

**Flow:**

1. Interested parent/person Admin se contact karta hai, ya public page se hi enquiry submit karta hai → ek Enquiry record banta hai (jaisa abhi hota hai).
2. Staff usse follow up karta hai — call, visit — same existing enquiry stages ke through.
3. Admin satisfied hone par enquiry ko **seedha Student mein convert karta hai** — chahe wo bacche ka full admission ho ya abhi sirf library interest hi kyun na ho.
4. Convert hote hi student ke linked Parent ko turant normal **Parent Portal access** mil jaata hai — jisme library/inventory ka "My Items" aur wishlist bhi shaamil hai, exactly jaise kisi bhi doosre enrolled student ke parent ko milta hai.

*Example:* Ek parent apne bacche ka admission final karne se pehle sirf kuch story books borrow karke dekhna chahte hain. Admin unki enquiry ko seedha Student mein convert kar deta hai — unhe turant Parent Portal access mil jaata hai, jahan se wo borrow/return kar sakte hain aur apna history dekh sakte hain.

*Fayda:* Ek hi conversion pipeline, ek hi entity type (Student) — na alag Member-type record maintain karna padta hai, na do tarah ke access-level manage karne padte hain. System simple rehta hai, aur Admin ke paas poora control rehta hai ki kaun student banega — koi bhi random khud se seedha sign up nahi kar sakta, sab kuch Admin ke approval se hi hota hai.

---

## 6. Ye Kaise Kaam Karega — Ek Simple Example

Isko poori tarah clear karne ke liye, module live hone ke baad ek normal din kuch is tarah dikhega:

- Story books ka ek naya carton aata hai → Admin ise Stock In ke roop mein record karta hai → stock count turant update ho jaata hai → is book ko wishlist kiye hue sabhi parents ko "ab available hai" notification chala jaata hai.
- Ek teacher "Pencil" issue karna chahti hai, jo Admin ne pehle se direct-issue ke liye enable kar rakhi hai → seedha issue ho jaati hai, koi approval wait nahi. Wahi teacher "Sports Kit" issue karna chahti hai → ye category approval maangti hai, request Admin ke paas jaati hai.
- Ek naya interested parent (abhi tak admitted nahi) public page par ek toy dekh kar enquiry karta hai → Admin unki enquiry ko seedha Student mein convert kar deta hai.
- Wahi parent apne bacche ke liye ek "Craft Kit" khareedte hain, jo unki class (Nursery) ke liye already free hai (poori Books/Kits category par free-class setting hai) → system automatically price zero dikhata hai.
- Ek doosra parent ek mehenga science kit borrow karna chahta hai, jiski selling price uske tay security deposit se zyada hai → system issue block kar deta hai aur issuing teacher ko alert deta hai; Admin deposit adjust karke hi aage badhta hai.
- Return date nikal jaati hai aur ek book wapas nahi aayi → system apne aap parent ko reminder bhejta hai aur Admin ke liye ise flag kar deta hai.
- Marker ka stock minimum level se neeche chala jaata hai → Admin ko time par dobara order karne ke liye low-stock alert milta hai.
- Month-end par, Admin dashboard kholta hai aur ek hi screen par dekhta hai ki kya expense hua, kya kam ho raha hai, kaunsi books/toys sabse zyada borrow/wishlist hui, aur kya abhi outstanding hai.

---

## 7. Roles & Access — Kaun Kya Kar Sakta Hai

| Role | Kya Kar Sakte Hain | Example |
|---|---|---|
| **Admin** | Full control — item add/edit/delete, stock in/out, issue, return, class-wise/category-wise pricing, available-for-sale, public visibility, saare reports, teachers ko category-wise/item-wise permission dena, enquiry ko Student mein convert karna. | Principal / Owner |
| **Permitted Teacher** | Admin dwara di gayi specific Library aur/ya Inventory permissions (Section 4.11), aur jo items/categories direct-issue ke liye enabled hain (Section 4.3) — baaki sab par approval lagti hai. | Store room sambhalne wali teacher (sirf Inventory), library corner sambhalne wali teacher (sirf Library) |
| **Baaki Teachers** | Sirf view-only access — apni class ko allocate hui items aur apna khud ka "My Items" history dekh sakte hain. | Apni class ki craft supplies check karti teacher |
| **Parent (enrolled student ka)** | Apne bacche ko issue/borrow/purchase hui items, unki return date, aur apni wishlist dekh sakte hain. | Borrowed story book track karta parent |
| **Public visitor** *(login ke bina)* | Sirf wo items dekh sakta hai jo Admin ne public page par dikhane ke liye ON ki hain; kuch bhi lene ke liye enquiry submit karta hai, jo aage Student conversion tak le jaati hai (Section 5). | Naya prospective parent jo school ki website dekh raha hai |

---

## 8. Key Benefits — Summary

- Har item ke liye ek hi system — chahe choti stationery ho ya library ki book — kuch bhi untracked nahi rehta.
- **Library alag system nahi, isi inventory ka hi ek hissa hai** — ek hi panel, ek hi Admin control, ek hi report.
- Poori accountability: hamesha pata rahega kiske paas kya hai, aur kab se hai.
- Apne aap milne wale reminders se overdue return, low-stock ya wishlist restock ko manually yaad rakhne ki zaroorat khatam ho jaati hai.
- Har teacher aur parent ko apna transparent view milta hai — kam sawaal, kam dispute.
- **By-default approval-required issue policy**, jise Admin category ya single-item level par selectively relax kar sakta hai — control aur speed dono saath.
- **Deposit-vs-price safety check** se koi bhi mehenga item galti se kam deposit par bahar nahi jaata.
- **Available for Sale** by-default OFF rehta hai — koi item galti se bikne ke liye khula nahi rehta.
- Class-wise ya poori-category-wise free/chargeable setting se fee-structure flexibility milti hai, bina duplicate items banaye.
- Public page visibility se school apni website ko live stock ke saath jod sakta hai, aur wishlist se pata chalta hai ki demand kahan hai.
- Bulk upload ghanto ki manual entry bachata hai, saath hi final hone se pehle ek safe review step bhi deta hai.
- **Library aur Inventory ke liye alag-alag, category-wise permissions** — Admin ko "sab kuch" ya "kuch nahi" access ke beech choose nahi karna padta.
- **Bahar ke logon ko access dene ke liye koi naya public system nahi banana padta** — existing, trusted Enquiry process seedha Student conversion tak le jaata hai, poore Admin control ke saath.
- Poora system ek hi baar mein, ek complete scope ke roop mein taiyar hota hai — koi cheez "baad mein milegi" wale wait mein nahi rehti.

---

## 9. Conclusion

Ye module school ki har physical item ko — ek pencil se lekar library ki poori book collection tak — ek hi simple, transparent system ke andar laata hai. Library ko ek alag module banane ke bajaye, ye usi inventory ke andar ek specialized lending workflow ke roop mein rakha gaya hai, aur bahar ke logon ke liye access bhi ek naya public signup banane ke bajaye existing, Admin-controlled Enquiry process se — seedha Student conversion tak — milta hai.

By-default approval-required issue policy, deposit-vs-price safety check, "Available for Sale" ka default-off rehna, class/category-wise free settings, public page visibility, aur wishlist jaise features isse aur safe, flexible aur parent-friendly banate hain, jabki Library aur Inventory ke liye alag-alag category-wise ya item-wise permissions Admin ko bilkul specific control dete hain ki kaun kya kar sakta hai.

Ye manual registers ko hatata hai, Admin ke daily follow-up kaam ko kam karta hai, aur staff aur parents dono ko ye clear jaankari deta hai ki unke paas kya hai aur unse kya expect kiya ja raha hai — ye sab itna simple rehte hue ki daily use mein koi rukawat na aaye.

---

*Draft specification — figures, category names aur field names illustrative hain, development shuru hone se pehle final discussion mein confirm honge.*
