/** Beginner reference cards for Uzbek learners. Independent of account/MongoDB. */
export type Word = { en: string; uz: string };
export const alphabet = [
  ['A','ey','Apple','Olma'],['B','bi','Book','Kitob'],['C','si','City','Shahar'],['D','di','Door','Eshik'],
  ['E','i','Egg','Tuxum'],['F','ef','Fish','Baliq'],['G','ji','Garden','Bog‘'],['H','eych','House','Uy'],
  ['I','ay','Ice','Muz'],['J','jey','Juice','Sharbat'],['K','key','Key','Kalit'],['L','el','Lamp','Chiroq'],
  ['M','em','Moon','Oy'],['N','en','Night','Tun'],['O','ou','Orange','Apelsin'],['P','pi','Paper','Qog‘oz'],
  ['Q','kyu','Question','Savol'],['R','ar','River','Daryo'],['S','es','Sun','Quyosh'],['T','ti','Table','Stol'],
  ['U','yu','Umbrella','Soyabon'],['V','vi','Village','Qishloq'],['W','dabl-yu','Window','Deraza'],
  ['X','eks','X-ray','Rentgen'],['Y','uay','Yellow','Sariq'],['Z','zed / zi','Zoo','Hayvonot bog‘i'],
] as const;

const unitsEn = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const tensEn = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
const unitsUz = ['nol','bir','ikki','uch','to‘rt','besh','olti','yetti','sakkiz','to‘qqiz'];
const tensUz = ['','o‘n','yigirma','o‘ttiz','qirq','ellik','oltmish','yetmish','sakson','to‘qson'];
export function englishNumber(n: number): string {
  if (n < 20) return unitsEn[n]!;
  if (n < 100) return tensEn[Math.floor(n / 10)]! + (n % 10 ? '-' + unitsEn[n % 10] : '');
  if (n < 1000) return unitsEn[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + englishNumber(n % 100) : '');
  if (n < 1000000) return englishNumber(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + englishNumber(n % 1000) : '');
  return englishNumber(Math.floor(n / 1000000)) + ' million' + (n % 1000000 ? ' ' + englishNumber(n % 1000000) : '');
}
export function uzbekNumber(n: number): string {
  if (n < 10) return unitsUz[n]!;
  if (n < 100) return tensUz[Math.floor(n / 10)]! + (n % 10 ? ' ' + unitsUz[n % 10] : '');
  if (n < 1000) return (n >= 200 ? unitsUz[Math.floor(n / 100)] + ' ' : '') + 'yuz' + (n % 100 ? ' ' + uzbekNumber(n % 100) : '');
  if (n < 1000000) return (n >= 2000 ? uzbekNumber(Math.floor(n / 1000)) + ' ' : '') + 'ming' + (n % 1000 ? ' ' + uzbekNumber(n % 1000) : '');
  return (n >= 2000000 ? uzbekNumber(Math.floor(n / 1000000)) + ' ' : '') + 'million' + (n % 1000000 ? ' ' + uzbekNumber(n % 1000000) : '');
}
export const numbers = [...Array.from({length:101},(_,i)=>i),200,300,500,1000,1500,10000,100000,1000000].map(n=>({n,en:englishNumber(n),uz:uzbekNumber(n)}));

export type Group = { id:string; en:string; uz:string; words: Word[] };
const p = (en:string,uz:string):Word=>({en,uz});
export const phraseGroups:Group[] = [
 {id:'greetings',en:'Greetings & introductions',uz:'Salomlashish va tanishuv',words:[
 p('Hello!','Salom!'),p('Good morning.','Xayrli tong.'),p('Good afternoon.','Xayrli kun.'),p('Good evening.','Xayrli kech.'),
 p('How are you today?','Bugun ahvolingiz qanday?'),p('My name is Dilshod.','Mening ismim Dilshod.'),p('Nice to meet you.','Tanishganimdan xursandman.'),p('See you tomorrow.','Ertaga ko‘rishguncha.') ]},
 {id:'politeness',en:'Polite everyday English',uz:'Kundalik odobli iboralar',words:[
 p('Please help me.','Iltimos, menga yordam bering.'),p('Thank you very much.','Katta rahmat.'),p('You are welcome.','Arzimaydi.'),p('I am sorry.','Kechirasiz.'),
 p('Excuse me, may I ask a question?','Kechirasiz, savol bersam bo‘ladimi?'),p('Could you repeat that?','Buni takrorlay olasizmi?'),p('Please speak more slowly.','Iltimos, sekinroq gapiring.'),p('I do not understand yet.','Hali tushunmadim.') ]},
 {id:'shopping',en:'Shopping & money',uz:'Xarid va pul',words:[
 p('How much does this cost?','Bu qancha turadi?'),p('Do you have a smaller size?','Kichikroq o‘lchami bormi?'),p('Can I try this on?','Buni kiyib ko‘rsam bo‘ladimi?'),p('I would like to pay by card.','Karta bilan to‘lamoqchiman.'),
 p('Is there a discount?','Chegirma bormi?'),p('Please give me a receipt.','Iltimos, chek bering.'),p('I am looking for a blue shirt.','Men ko‘k ko‘ylak qidiryapman.'),p('I will take this one.','Men shuni olaman.') ]},
 {id:'travel',en:'Travel & directions',uz:'Sayohat va yo‘nalishlar',words:[
 p('Where is the nearest bus stop?','Eng yaqin avtobus bekati qayerda?'),p('How do I get to the station?','Vokzalga qanday borsam bo‘ladi?'),p('Please stop here.','Iltimos, shu yerda to‘xtang.'),p('What time does the train leave?','Poyezd soat nechada jo‘naydi?'),
 p('I need a ticket to Samarkand.','Menga Samarqandga chipta kerak.'),p('Is this seat available?','Bu joy bo‘shmi?'),p('I have a reservation.','Menda bron bor.'),p('Can you show me on the map?','Xaritada ko‘rsata olasizmi?') ]},
 {id:'study',en:'School & work',uz:'O‘qish va ish',words:[
 p('I have finished my homework.','Men uy vazifamni tugatdim.'),p('Could you explain this rule?','Bu qoidani tushuntirib bera olasizmi?'),p('I work in an office.','Men ofisda ishlayman.'),p('The meeting starts at nine.','Yig‘ilish soat to‘qqizda boshlanadi.'),
 p('I need more time to finish.','Tugatish uchun menga ko‘proq vaqt kerak.'),p('Please send the document.','Iltimos, hujjatni yuboring.'),p('I am preparing for an exam.','Men imtihonga tayyorlanyapman.'),p('Could I ask for feedback?','Fikringizni bildira olasizmi?') ]},
 {id:'emergencies',en:'Health & safety',uz:'Salomatlik va xavfsizlik',words:[
 p('I need a doctor.','Menga shifokor kerak.'),p('Please call an ambulance.','Iltimos, tez yordam chaqiring.'),p('I have a headache.','Boshim og‘riyapti.'),p('Where is the pharmacy?','Dorixona qayerda?'),
 p('I am allergic to peanuts.','Menda yer yong‘oqqa allergiya bor.'),p('I have lost my passport.','Pasportimni yo‘qotdim.'),p('Please call the police.','Iltimos, politsiyani chaqiring.'),p('Is there a safe exit?','Xavfsiz chiqish joyi bormi?') ]},
 {id:'phone',en:'Telephone & messages',uz:'Telefon va xabarlar',words:[
 p('Hello, may I speak to the manager?','Assalomu alaykum, menejer bilan gaplashsam bo‘ladimi?'),
 p('I will call you back in ten minutes.','Sizga o‘n daqiqadan keyin qayta qo‘ng‘iroq qilaman.'),
 p('The connection is breaking up.','Aloqa uzilib-uzilib eshitilyapti.'),
 p('Could you send me the address by message?','Manzilni xabar orqali yubora olasizmi?'),
 p('I missed your call while I was in class.','Darsda bo‘lganimda qo‘ng‘irog‘ingizni o‘tkazib yuboribman.'),
 p('Please leave your name after the tone.','Signal ovozidan keyin ismingizni qoldiring.') ]},
 {id:'calendar',en:'Dates & appointments',uz:'Sanalar va uchrashuvlar',words:[
 p('What is the date today?','Bugun sana nechanchi?'),
 p('My appointment is on Tuesday morning.','Uchrashuvim seshanba kuni ertalab.'),
 p('Shall we meet next Friday?','Kelasi juma kuni uchrashamizmi?'),
 p('The office closes at half past five.','Ofis soat besh yarimda yopiladi.'),
 p('Could we move the meeting to December?','Uchrashuvni dekabr oyiga ko‘chira olamizmi?'),
 p('I will be free after lunch tomorrow.','Ertaga tushlikdan keyin bo‘sh bo‘laman.') ]},
 {id:'restaurant',en:'Eating out',uz:'Restoranda suhbatlar',words:[
 p('Do you have a table near the window?','Deraza yonida stolingiz bormi?'),
 p('I would like to see the menu, please.','Iltimos, taomnomani ko‘rsam.'),
 p('Does this dish contain meat?','Bu taom tarkibida go‘sht bormi?'),
 p('Could you make it less spicy?','Buni kamroq achchiq qilib tayyorlay olasizmi?'),
 p('We are ready to order our food.','Biz ovqat buyurtma qilishga tayyormiz.'),
 p('Could we pay separately?','Alohida-alohida to‘lasak bo‘ladimi?') ]},
 {id:'family',en:'At home & family',uz:'Oila va uyda',words:[
 p('Please set the table for dinner.','Iltimos, kechki ovqatga dasturxon yozing.'),
 p('Who will pick the children up today?','Bugun bolalarni kim olib keladi?'),
 p('Do not forget to lock the front door.','Kirish eshigini qulflashni unutmang.'),
 p('The washing machine has finished its cycle.','Kir yuvish mashinasi ishini tugatdi.'),
 p('Let us tidy the living room together.','Keling, mehmonxonani birga tartibga keltiramiz.'),
 p('We are visiting our relatives this weekend.','Bu hafta oxiri qarindoshlarimiznikiga boramiz.') ]},
 {id:'doctor',en:'At the doctor',uz:'Shifokor qabulida',words:[
 p('I have had a fever since last night.','Kechadan beri isitmam bor.'),
 p('Where can I collect my test results?','Tahlil natijalarimni qayerdan olsam bo‘ladi?'),
 p('How often should I take this medicine?','Bu dorini qanchalik tez-tez ichishim kerak?'),
 p('Please tell the doctor about your allergy.','Iltimos, shifokorga allergiyangiz haqida ayting.'),
 p('Is there a pharmacy open nearby?','Yaqin atrofda ochiq dorixona bormi?'),
 p('I would like to book a check-up.','Tibbiy ko‘rikka yozilmoqchiman.') ]},
 {id:'bank',en:'At the bank',uz:'Bankdagi suhbatlar',words:[
 p('I need to open a savings account.','Men jamg‘arma hisobvarag‘i ochmoqchiman.'),
 p('Can I transfer money to another card?','Boshqa kartaga pul o‘tkaza olamanmi?'),
 p('The ATM did not give me any cash.','Bankomat menga naqd pul bermadi.'),
 p('Please check the transaction reference.','Iltimos, tranzaksiya raqamini tekshiring.'),
 p('What is today’s exchange rate?','Bugungi valyuta kursi qancha?'),
 p('I would like to change my card PIN.','Kartamning PIN-kodini o‘zgartirmoqchiman.') ]},
 {id:'online',en:'Internet & technology',uz:'Internet va texnologiya',words:[
 p('My internet connection stopped working.','Internet aloqam ishlamay qoldi.'),
 p('Could you help me reset my password?','Parolimni tiklashga yordam bera olasizmi?'),
 p('The file is too large to send by email.','Fayl elektron pochta orqali yuborish uchun juda katta.'),
 p('Please turn on your microphone.','Iltimos, mikrofoningizni yoqing.'),
 p('I cannot hear you during the video call.','Videoqo‘ng‘iroqda sizni eshitmayapman.'),
 p('The update will take a few minutes.','Yangilanish bir necha daqiqa davom etadi.') ]},
 {id:'market',en:'Market & bargaining',uz:'Bozor va savdolashish',words:[
 p('Are these peaches fresh today?','Bu shaftolilar bugun yangimi?'),
 p('Could you weigh one kilogram for me?','Menga bir kilogramm tortib bera olasizmi?'),
 p('Is there a better price for three pieces?','Uchta olsam, arzonroq bo‘ladimi?'),
 p('I would like a bag for these vegetables.','Bu sabzavotlar uchun paket kerak.'),
 p('Please keep the change.','Qaytimni o‘zingizda qoldiring.'),
 p('Do you accept payment by phone?','Telefon orqali to‘lov qabul qilasizmi?') ]},
 {id:'weather',en:'Weather conversations',uz:'Ob-havo suhbatlari',words:[
 p('It looks like it may rain this afternoon.','Bugun tushdan keyin yomg‘ir yog‘adiganga o‘xshaydi.'),
 p('The mornings are getting colder now.','Endi ertalablar sovuqlashib boryapti.'),
 p('Take an umbrella before you leave.','Chiqishdan oldin soyabon oling.'),
 p('The roads are slippery after the snowfall.','Qor yog‘gandan keyin yo‘llar sirpanchiq.'),
 p('The weather forecast says it will be sunny.','Ob-havo ma’lumotiga ko‘ra, quyoshli bo‘ladi.'),
 p('The wind is too strong to cycle safely.','Shamol xavfsiz velosiped haydash uchun juda kuchli.') ]},
 {id:'jobs',en:'Job interviews',uz:'Ish suhbati',words:[
 p('I have two years of relevant experience.','Bu sohada ikki yillik tajribam bor.'),
 p('I am interested in this position.','Men ushbu lavozimga qiziqaman.'),
 p('Could you explain the main responsibilities?','Asosiy vazifalarni tushuntirib bera olasizmi?'),
 p('My strongest skill is problem-solving.','Mening eng kuchli ko‘nikmam muammo yechishdir.'),
 p('When would the successful applicant start?','Tanlangan nomzod qachon ish boshlaydi?'),
 p('Thank you for considering my application.','Arizamni ko‘rib chiqqaningiz uchun rahmat.') ]},
 {id:'study-chat',en:'Classroom conversations',uz:'Darsdagi suhbatlar',words:[
 p('Which page should we open?','Qaysi sahifani ochishimiz kerak?'),
 p('Could I work with a partner?','Sherik bilan ishlasam bo‘ladimi?'),
 p('I need another example of this grammar rule.','Bu grammatika qoidasiga yana bir misol kerak.'),
 p('When is the assignment due?','Topshiriqni qachongacha topshirish kerak?'),
 p('May I answer the next question?','Keyingi savolga javob bersam bo‘ladimi?'),
 p('I will review these words at home.','Bu so‘zlarni uyda takrorlayman.') ]},
 {id:'getting-help',en:'Asking for help',uz:'Yordam so‘rash',words:[
 p('Could you show me how this works?','Bu qanday ishlashini ko‘rsata olasizmi?'),
 p('I am not sure which form to fill out.','Qaysi shaklni to‘ldirishni bilmayapman.'),
 p('Would you mind checking my answer?','Javobimni tekshirib bera olasizmi?'),
 p('I need directions to the nearest clinic.','Eng yaqin poliklinikaga yo‘l ko‘rsatishingiz kerak.'),
 p('Please write it down so I can remember.','Eslab qolishim uchun iltimos, yozib bering.'),
 p('Thank you, that explanation was very clear.','Rahmat, bu tushuntirish juda aniq bo‘ldi.') ]},

];

export const vocabularyGroups:Group[] = [
 {id:'family',en:'Family',uz:'Oila',words:[p('mother','ona'),p('father','ota'),p('sister','opa / singil'),p('brother','aka / uka'),p('grandmother','buvi'),p('grandfather','bobo'),p('aunt','amma / xola'),p('uncle','amaki / tog‘a'),p('cousin','amakivachcha / xolavachcha'),p('daughter','qiz farzand'),p('son','o‘g‘il farzand'),p('parents','ota-ona')]},
 {id:'food',en:'Food & drinks',uz:'Oziq-ovqat va ichimliklar',words:[p('bread','non'),p('rice','guruch'),p('chicken','tovuq go‘shti'),p('carrot','sabzi'),p('onion','piyoz'),p('potato','kartoshka'),p('cucumber','bodring'),p('tomato','pomidor'),p('milk','sut'),p('water','suv'),p('tea','choy'),p('coffee','qahva')]},
 {id:'home',en:'Home',uz:'Uy jihozlari',words:[p('sofa','divan'),p('chair','stul'),p('bed','karavot'),p('pillow','yostiq'),p('blanket','ko‘rpa'),p('mirror','oyna'),p('refrigerator','muzlatkich'),p('kettle','choynak'),p('shelf','tokcha'),p('carpet','gilam'),p('curtain','parda'),p('stove','plita')]},
 {id:'transport',en:'Transport',uz:'Transport',words:[p('car','mashina'),p('bus','avtobus'),p('train','poyezd'),p('bicycle','velosiped'),p('airplane','samolyot'),p('taxi','taksi'),p('motorcycle','mototsikl'),p('road','yo‘l'),p('traffic light','svetofor'),p('airport','aeroport'),p('station','bekat'),p('ticket','chipta')]},
 {id:'work',en:'Work & occupations',uz:'Ish va kasblar',words:[p('teacher','o‘qituvchi'),p('nurse','hamshira'),p('engineer','muhandis'),p('driver','haydovchi'),p('manager','menejer'),p('accountant','hisobchi'),p('mechanic','mexanik'),p('designer','dizayner'),p('farmer','dehqon'),p('journalist','jurnalist'),p('cashier','kassir'),p('builder','quruvchi')]},
 {id:'weather',en:'Weather & nature',uz:'Ob-havo va tabiat',words:[p('rain','yomg‘ir'),p('snow','qor'),p('wind','shamol'),p('cloud','bulut'),p('sunshine','quyosh nuri'),p('fog','tuman'),p('storm','bo‘ron'),p('temperature','harorat'),p('mountain','tog‘'),p('forest','o‘rmon'),p('desert','cho‘l'),p('lake','ko‘l')]},
 {id:'health',en:'Body & health',uz:'Tana va salomatlik',words:[p('head','bosh'),p('shoulder','yelka'),p('knee','tizza'),p('finger','barmoq'),p('stomach','qorin'),p('heart','yurak'),p('tooth','tish'),p('medicine','dori'),p('hospital','shifoxona'),p('pain','og‘riq'),p('fever','isitma'),p('appointment','qabul vaqti')]},
 {id:'study',en:'Study & technology',uz:'O‘qish va texnologiya',words:[p('notebook','daftar'),p('pencil','qalam'),p('eraser','o‘chirg‘ich'),p('dictionary','lug‘at'),p('exam','imtihon'),p('lesson','dars'),p('keyboard','klaviatura'),p('screen','ekran'),p('charger','quvvatlagich'),p('password','parol'),p('website','veb-sayt'),p('download','yuklab olish')]},
 {id:'shopping',en:'Shopping & clothing',uz:'Xarid va kiyimlar',words:[p('jacket','kurtka'),p('dress','ko‘ylak'),p('trousers','shim'),p('shoes','poyabzal'),p('hat','bosh kiyim'),p('scarf','sharf'),p('wallet','hamyon'),p('price','narx'),p('discount','chegirma'),p('receipt','chek'),p('size','o‘lcham'),p('fitting room','kiyib ko‘rish xonasi')]},
 {id:'places',en:'Places in a city',uz:'Shahardagi joylar',words:[p('library','kutubxona'),p('museum','muzey'),p('bank','bank'),p('market','bozor'),p('park','bog‘'),p('bridge','ko‘prik'),p('square','maydon'),p('restaurant','restoran'),p('hotel','mehmonxona'),p('cinema','kinoteatr'),p('post office','pochta bo‘limi'),p('stadium','stadion')]},
 {id:'feelings',en:'Feelings & qualities',uz:'Hissiyotlar va sifatlar',words:[p('happy','xursand'),p('worried','xavotirli'),p('tired','charchagan'),p('excited','hayajonlangan'),p('confident','o‘ziga ishongan'),p('confused','chalg‘igan'),p('patient','sabrli'),p('curious','qiziquvchan'),p('calm','xotirjam'),p('proud','faxrlangan'),p('grateful','minnatdor'),p('brave','jasur')]},
];

/** High-frequency English building blocks. Intentionally separate from topic nouns. */
export const usefulWordGroups:Group[] = [
 {id:'questions',en:'Question words',uz:'Savol so‘zlari',words:[p('who','kim'),p('what','nima'),p('when','qachon'),p('where','qayerda'),p('why','nima uchun'),p('which','qaysi'),p('whose','kimning'),p('how','qanday'),p('how many','nechta'),p('how much','qancha')]},
 {id:'verbs',en:'Core verbs',uz:'Asosiy fe’llar',words:[p('be','bo‘lmoq'),p('have','ega bo‘lmoq'),p('do','qilmoq'),p('make','yasamoq / tayyorlamoq'),p('go','bormoq'),p('come','kelmoq'),p('take','olmoq'),p('give','bermoq'),p('need','kerak bo‘lmoq'),p('want','xohlamoq'),p('like','yoqtirmoq'),p('know','bilmoq'),p('think','o‘ylamoq'),p('learn','o‘rganmoq')]},
 {id:'qualities',en:'Everyday describing words',uz:'Kundalik sifatlar',words:[p('big','katta'),p('small','kichik'),p('easy','oson'),p('difficult','qiyin'),p('early','erta'),p('late','kech'),p('near','yaqin'),p('far','uzoq'),p('busy','band'),p('free','bo‘sh / bepul'),p('important','muhim'),p('possible','mumkin'),p('ready','tayyor'),p('careful','ehtiyotkor')]},
 {id:'connectors',en:'Frequency & linking words',uz:'Ravish va bog‘lovchilar',words:[p('always','har doim'),p('usually','odatda'),p('often','tez-tez'),p('sometimes','ba’zan'),p('never','hech qachon'),p('already','allaqachon'),p('still','hali ham'),p('soon','tez orada'),p('because','chunki'),p('although','garchi'),p('however','biroq'),p('therefore','shuning uchun'),p('before','oldin'),p('after','keyin')]},
 {id:'positions',en:'Position & directions',uz:'Joylashuv va yo‘nalish',words:[p('here','shu yerda'),p('there','u yerda'),p('inside','ichkarida'),p('outside','tashqarida'),p('above','yuqorida'),p('below','pastda'),p('between','orasida'),p('beside','yonida'),p('behind','orqasida'),p('ahead','oldinda'),p('left','chap'),p('right','o‘ng'),p('opposite','qarama-qarshi'),p('around','atrofida')]},
 {id:'actions',en:'Useful actions',uz:'Foydali harakatlar',words:[p('open','ochmoq'),p('close','yopmoq'),p('start','boshlamoq'),p('finish','tugatmoq'),p('wait','kutmoq'),p('ask','so‘ramoq'),p('answer','javob bermoq'),p('choose','tanlamoq'),p('listen','tinglamoq'),p('repeat','takrorlamoq'),p('read','o‘qimoq'),p('write','yozmoq'),p('speak','gapirmoq'),p('understand','tushunmoq')]},
];
