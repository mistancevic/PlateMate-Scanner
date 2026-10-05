// The reference table: basic foods that carry no label and no barcode. Vegetables, fruit, eggs, meat, fish, dairy by
// its generic name, grains, legumes, nuts, oils, basics. Values per 100 g from USDA FoodData Central (SR Legacy) unless
// the source says otherwise; carbohydrate stored excluding fibre, the app's convention. Names in English, German and
// Serbian (Latin and Cyrillic), so "tikvice" finds the courgette. A courgette is a courgette in every city.
import type { Food } from "./pilot";

export type RefFood = { id: string; en: string; de: string; sr: string; cyr: string; kcal: number; protein: number; fats: number; carbsTotal: number; fiber: number; ready: boolean; source?: string };
const U = "USDA FoodData Central, SR Legacy";
const T = "typical values, producers vary";
// id, en, de, sr, cyr, kcal, protein, fats, carbs (total, as USDA prints), fibre, ready to eat
const R: [string, string, string, string, string, number, number, number, number, number, boolean, string?][] = [
  // vegetables, raw unless said
  ["courgette", "Courgette (zucchini), raw", "Zucchini, roh", "Tikvice, sveže", "Тиквице, свеже", 17, 1.2, 0.3, 3.1, 1.0, false],
  ["tomato", "Tomato, raw", "Tomate, roh", "Paradajz", "Парадајз", 18, 0.9, 0.2, 3.9, 1.2, true],
  ["cucumber", "Cucumber, raw", "Gurke, roh", "Krastavac", "Краставац", 15, 0.7, 0.1, 3.6, 0.5, true],
  ["pepper-red", "Bell pepper, red, raw", "Paprika, rot, roh", "Paprika, crvena", "Паприка, црвена", 31, 1.0, 0.3, 6.0, 2.1, true],
  ["onion", "Onion, raw", "Zwiebel, roh", "Crni luk", "Црни лук", 40, 1.1, 0.1, 9.3, 1.7, true],
  ["garlic", "Garlic, raw", "Knoblauch, roh", "Beli luk", "Бели лук", 149, 6.4, 0.5, 33.1, 2.1, true],
  ["carrot", "Carrot, raw", "Karotte, roh", "Šargarepa", "Шаргарепа", 41, 0.9, 0.2, 9.6, 2.8, true],
  ["potato", "Potato, raw", "Kartoffel, roh", "Krompir, sirov", "Кромпир, сиров", 77, 2.0, 0.1, 17.5, 2.2, false],
  ["potato-boiled", "Potato, boiled", "Kartoffel, gekocht", "Krompir, kuvan", "Кромпир, куван", 87, 1.9, 0.1, 20.1, 1.8, true],
  ["sweet-potato", "Sweet potato, raw", "Süßkartoffel, roh", "Batat", "Батат", 86, 1.6, 0.1, 20.1, 3.0, false],
  ["broccoli", "Broccoli, raw", "Brokkoli, roh", "Brokoli", "Броколи", 34, 2.8, 0.4, 6.6, 2.6, true],
  ["cauliflower", "Cauliflower, raw", "Blumenkohl, roh", "Karfiol", "Карфиол", 25, 1.9, 0.3, 5.0, 2.0, true],
  ["cabbage", "Cabbage, raw", "Weißkohl, roh", "Kupus", "Купус", 25, 1.3, 0.1, 5.8, 2.5, true],
  ["sauerkraut", "Sauerkraut", "Sauerkraut", "Kiseli kupus", "Кисели купус", 19, 0.9, 0.1, 4.3, 2.9, true],
  ["spinach", "Spinach, raw", "Spinat, roh", "Spanać", "Спанаћ", 23, 2.9, 0.4, 3.6, 2.2, true],
  ["lettuce", "Lettuce, raw", "Kopfsalat", "Zelena salata", "Зелена салата", 15, 1.4, 0.2, 2.9, 1.3, true],
  ["kale", "Kale, raw", "Grünkohl, roh", "Kelj", "Кељ", 49, 4.3, 0.9, 8.8, 3.6, true],
  ["mushrooms", "Mushrooms, white, raw", "Champignons, roh", "Šampinjoni", "Шампињони", 22, 3.1, 0.3, 3.3, 1.0, true],
  ["aubergine", "Aubergine, raw", "Aubergine, roh", "Plavi patlidžan", "Плави патлиџан", 25, 1.0, 0.2, 5.9, 3.0, false],
  ["green-beans", "Green beans, raw", "Grüne Bohnen, roh", "Boranija", "Боранија", 31, 1.8, 0.2, 7.0, 2.7, false],
  ["peas", "Peas, green, raw", "Erbsen, roh", "Grašak", "Грашак", 81, 5.4, 0.4, 14.5, 5.7, false],
  ["corn", "Sweetcorn, kernels", "Zuckermais", "Kukuruz šećerac", "Кукуруз шећерац", 86, 3.3, 1.2, 19.0, 2.7, true],
  ["beetroot", "Beetroot, raw", "Rote Bete, roh", "Cvekla", "Цвекла", 43, 1.6, 0.2, 9.6, 2.8, false],
  ["celery", "Celery, raw", "Staudensellerie", "Celer, stabljika", "Целер, стабљика", 16, 0.7, 0.2, 3.0, 1.6, true],
  ["leek", "Leek, raw", "Lauch, roh", "Praziluk", "Празилук", 61, 1.5, 0.3, 14.2, 1.8, false],
  ["pumpkin", "Pumpkin, raw", "Kürbis, roh", "Bundeva", "Бундева", 26, 1.0, 0.1, 6.5, 0.5, false],
  ["avocado", "Avocado", "Avocado", "Avokado", "Авокадо", 160, 2.0, 14.7, 8.5, 6.7, true],
  ["olives", "Olives, green, pickled", "Oliven, grün", "Masline, zelene", "Маслине, зелене", 145, 1.0, 15.3, 3.8, 3.3, true],
  ["sweet-corn-cob", "Corn on the cob, boiled", "Maiskolben, gekocht", "Kukuruz, kuvan klip", "Кукуруз, куван клип", 96, 3.4, 1.5, 21.0, 2.4, true],
  // fruit
  ["apple", "Apple, raw", "Apfel", "Jabuka", "Јабука", 52, 0.3, 0.2, 13.8, 2.4, true],
  ["banana", "Banana, raw", "Banane", "Banana", "Банана", 89, 1.1, 0.3, 22.8, 2.6, true],
  ["orange", "Orange, raw", "Orange", "Pomorandža", "Поморанџа", 47, 0.9, 0.1, 11.8, 2.4, true],
  ["mandarin", "Mandarin, raw", "Mandarine", "Mandarina", "Мандарина", 53, 0.8, 0.3, 13.3, 1.8, true],
  ["grapes", "Grapes, raw", "Weintrauben", "Grožđe", "Грожђе", 69, 0.7, 0.2, 18.1, 0.9, true],
  ["strawberries", "Strawberries, raw", "Erdbeeren", "Jagode", "Јагоде", 32, 0.7, 0.3, 7.7, 2.0, true],
  ["blueberries", "Blueberries, raw", "Heidelbeeren", "Borovnice", "Боровнице", 57, 0.7, 0.3, 14.5, 2.4, true],
  ["raspberries", "Raspberries, raw", "Himbeeren", "Maline", "Малине", 52, 1.2, 0.7, 11.9, 6.5, true],
  ["watermelon", "Watermelon, raw", "Wassermelone", "Lubenica", "Лубеница", 30, 0.6, 0.2, 7.6, 0.4, true],
  ["melon", "Melon, cantaloupe, raw", "Melone", "Dinja", "Диња", 34, 0.8, 0.2, 8.2, 0.9, true],
  ["peach", "Peach, raw", "Pfirsich", "Breskva", "Бресква", 39, 0.9, 0.3, 9.5, 1.5, true],
  ["pear", "Pear, raw", "Birne", "Kruška", "Крушка", 57, 0.4, 0.1, 15.2, 3.1, true],
  ["plum", "Plum, raw", "Pflaume", "Šljiva", "Шљива", 46, 0.7, 0.3, 11.4, 1.4, true],
  ["cherries", "Cherries, sweet, raw", "Kirschen", "Trešnje", "Трешње", 63, 1.1, 0.2, 16.0, 2.1, true],
  ["kiwi", "Kiwi, raw", "Kiwi", "Kivi", "Киви", 61, 1.1, 0.5, 14.7, 3.0, true],
  ["pineapple", "Pineapple, raw", "Ananas", "Ananas", "Ананас", 50, 0.5, 0.1, 13.1, 1.4, true],
  ["mango", "Mango, raw", "Mango", "Mango", "Манго", 60, 0.8, 0.4, 15.0, 1.6, true],
  ["lemon", "Lemon, raw", "Zitrone", "Limun", "Лимун", 29, 1.1, 0.3, 9.3, 2.8, true],
  ["dates", "Dates, dried", "Datteln, getrocknet", "Urme, sušene", "Урме, сушене", 277, 1.8, 0.2, 75.0, 6.7, true],
  ["raisins", "Raisins", "Rosinen", "Suvo grožđe", "Суво грожђе", 299, 3.1, 0.5, 79.2, 3.7, true],
  ["figs", "Figs, raw", "Feigen", "Smokve, sveže", "Смокве, свеже", 74, 0.8, 0.3, 19.2, 2.9, true],
  ["pomegranate", "Pomegranate, raw", "Granatapfel", "Nar", "Нар", 83, 1.7, 1.2, 18.7, 4.0, true],
  ["apricot", "Apricot, raw", "Aprikose", "Kajsija", "Кајсија", 48, 1.4, 0.4, 11.1, 2.0, true],
  // eggs, meat, fish
  ["egg", "Egg, whole, raw", "Ei, ganz", "Jaje, celo", "Јаје, цело", 143, 12.6, 9.5, 0.7, 0, false],
  ["egg-boiled", "Egg, boiled", "Ei, gekocht", "Jaje, kuvano", "Јаје, кувано", 155, 12.6, 10.6, 1.1, 0, true],
  ["egg-white", "Egg white, raw", "Eiklar", "Belance", "Беланце", 52, 10.9, 0.2, 0.7, 0, false],
  ["chicken-breast-raw", "Chicken breast, raw", "Hähnchenbrust, roh", "Pileća prsa, sirova", "Пилећа прса, сирова", 120, 22.5, 2.6, 0, 0, false],
  ["chicken-breast", "Chicken breast, cooked", "Hähnchenbrust, gegart", "Pileća prsa, pečena", "Пилећа прса, печена", 165, 31.0, 3.6, 0, 0, true],
  ["chicken-thigh-raw", "Chicken thigh, raw, skinless", "Hähnchenschenkel, roh", "Pileći batak, sirov", "Пилећи батак, сиров", 121, 19.7, 4.1, 0, 0, false],
  ["turkey-breast-raw", "Turkey breast, raw", "Putenbrust, roh", "Ćureća prsa, sirova", "Ћурећа прса, сирова", 114, 23.7, 1.5, 0, 0, false],
  ["beef-mince", "Beef mince, 15 % fat, raw", "Rinderhack, roh", "Mlevena junetina", "Млевена јунетина", 215, 18.6, 15.0, 0, 0, false],
  ["beef-lean-raw", "Beef, lean cut, raw", "Rind, mager, roh", "Junetina, nemasna", "Јунетина, немасна", 137, 21.0, 5.4, 0, 0, false],
  ["pork-loin-raw", "Pork loin, raw", "Schweinelende, roh", "Svinjski kare", "Свињски каре", 143, 21.0, 6.0, 0, 0, false],
  ["pork-mince", "Pork mince, raw", "Schweinehack, roh", "Mlevena svinjetina", "Млевена свињетина", 263, 16.9, 21.2, 0, 0, false],
  ["veal-raw", "Veal, lean, raw", "Kalb, mager, roh", "Teletina", "Телетина", 112, 20.3, 2.9, 0, 0, false],
  ["lamb-raw", "Lamb, raw", "Lamm, roh", "Jagnjetina", "Јагњетина", 258, 16.6, 20.9, 0, 0, false],
  ["ham", "Ham, cooked, sliced", "Kochschinken", "Šunka, kuvana", "Шунка, кувана", 145, 20.9, 5.5, 1.5, 0, true, T],
  ["chicken-liver", "Chicken liver, raw", "Hühnerleber, roh", "Pileća džigerica", "Пилећа џигерица", 119, 16.9, 4.8, 0.7, 0, false],
  ["salmon-raw", "Salmon, raw", "Lachs, roh", "Losos, sirov", "Лосос, сиров", 208, 20.4, 13.4, 0, 0, false],
  ["tuna-canned", "Tuna, canned in water, drained", "Thunfisch in Wasser", "Tunjevina u sopstvenom soku", "Туњевина у сопственом соку", 116, 25.5, 0.8, 0, 0, true],
  ["cod-raw", "Cod, raw", "Kabeljau, roh", "Bakalar, sirov", "Бакалар, сиров", 82, 17.8, 0.7, 0, 0, false],
  ["trout-raw", "Trout, raw", "Forelle, roh", "Pastrmka, sirova", "Пастрмка, сирова", 119, 20.5, 3.5, 0, 0, false],
  ["sardines-canned", "Sardines, canned in oil, drained", "Sardinen in Öl", "Sardine u ulju", "Сардине у уљу", 208, 24.6, 11.5, 0, 0, true],
  ["shrimp", "Shrimp, raw", "Garnelen, roh", "Škampi, sirovi", "Шкампи, сирови", 85, 20.1, 0.5, 0, 0, false],
  // dairy, by its generic name
  ["milk-whole", "Milk, whole 3.5 %", "Vollmilch 3,5 %", "Mleko, 3,2 %", "Млеко, 3,2 %", 61, 3.2, 3.3, 4.8, 0, true],
  ["milk-15", "Milk, 1.5 %", "Milch 1,5 %", "Mleko, 1,5 %", "Млеко, 1,5 %", 46, 3.4, 1.5, 4.9, 0, true],
  ["kefir", "Kefir", "Kefir", "Kefir", "Кефир", 41, 3.3, 1.0, 4.5, 0, true, T],
  ["yogurt-plain", "Yogurt, plain, whole", "Naturjoghurt, 3,5 %", "Jogurt, 2,8 %", "Јогурт, 2,8 %", 61, 3.5, 3.3, 4.7, 0, true],
  ["yogurt-greek", "Greek yogurt, 2 %", "Griechischer Joghurt 2 %", "Grčki jogurt, 2 %", "Грчки јогурт, 2 %", 73, 9.9, 1.9, 3.9, 0, true],
  ["quark-lowfat", "Quark, low fat", "Magerquark", "Posni sir (kvark)", "Посни сир (кварк)", 67, 12.0, 0.2, 4.0, 0, true],
  ["cottage", "Cottage cheese", "Hüttenkäse", "Svež sir, zrnasti", "Свеж сир, зрнасти", 98, 11.1, 4.3, 3.4, 0, true],
  ["white-cheese", "White cheese, brined (feta type)", "Feta / Weißkäse in Lake", "Beli sir, sitni", "Бели сир, ситни", 264, 14.2, 21.3, 4.1, 0, true],
  ["mozzarella", "Mozzarella", "Mozzarella", "Mocarela", "Моцарела", 280, 28.0, 17.0, 3.1, 0, true],
  ["gouda", "Gouda", "Gouda", "Gauda", "Гауда", 356, 24.9, 27.4, 2.2, 0, true],
  ["parmesan", "Parmesan", "Parmesan", "Parmezan", "Пармезан", 431, 38.5, 28.6, 4.1, 0, true],
  ["cream-cheese", "Cream cheese", "Frischkäse", "Krem sir", "Крем сир", 342, 5.9, 34.2, 4.1, 0, true],
  ["sour-cream", "Sour cream, 20 %", "Saure Sahne 20 %", "Pavlaka, 20 %", "Павлака, 20 %", 190, 2.5, 20.0, 3.0, 0, true, T],
  ["kajmak", "Kajmak", "Kajmak", "Kajmak", "Кајмак", 285, 4.0, 29.0, 2.0, 0, true, T],
  ["butter", "Butter", "Butter", "Maslac", "Маслац", 717, 0.9, 81.1, 0.1, 0, true],
  // grains, bread, legumes
  ["rice-white-cooked", "Rice, white, cooked", "Reis, weiß, gekocht", "Pirinač, kuvan", "Пиринач, куван", 130, 2.7, 0.3, 28.2, 0.4, true],
  ["rice-brown-cooked", "Rice, brown, cooked", "Vollkornreis, gekocht", "Integralni pirinač, kuvan", "Интегрални пиринач, куван", 112, 2.3, 0.9, 23.5, 1.8, true],
  ["pasta-cooked", "Pasta, cooked", "Nudeln, gekocht", "Testenina, kuvana", "Тестенина, кувана", 158, 5.8, 0.9, 30.9, 1.8, true],
  ["pasta-dry", "Pasta, dry", "Nudeln, trocken", "Testenina, suva", "Тестенина, сува", 371, 13.0, 1.5, 74.7, 3.2, false],
  ["oats", "Oats, rolled", "Haferflocken", "Ovsene pahuljice", "Овсене пахуљице", 379, 13.2, 6.5, 67.7, 10.1, true],
  ["bulgur-cooked", "Bulgur, cooked", "Bulgur, gekocht", "Bulgur, kuvan", "Булгур, куван", 83, 3.1, 0.2, 18.6, 4.5, true],
  ["couscous-cooked", "Couscous, cooked", "Couscous, gekocht", "Kuskus, kuvan", "Кускус, куван", 112, 3.8, 0.2, 23.2, 1.4, true],
  ["quinoa-cooked", "Quinoa, cooked", "Quinoa, gekocht", "Kinoa, kuvana", "Киноа, кувана", 120, 4.4, 1.9, 21.3, 2.8, true],
  ["polenta-cooked", "Polenta, cooked", "Polenta, gekocht", "Palenta, kuvana", "Палента, кувана", 70, 1.6, 0.2, 15.0, 1.0, true, T],
  ["bread-white", "Bread, white", "Weißbrot", "Beli hleb", "Бели хлеб", 265, 8.9, 3.2, 49.4, 2.7, true],
  ["bread-wholegrain", "Bread, wholegrain", "Vollkornbrot", "Integralni hleb", "Интегрални хлеб", 247, 12.5, 3.4, 41.3, 6.0, true],
  ["tortilla", "Tortilla, wheat", "Weizentortilla", "Tortilja", "Тортиља", 312, 8.0, 8.0, 52.0, 3.0, true, T],
  ["flour-wheat", "Wheat flour, white", "Weizenmehl", "Brašno, belo", "Брашно, бело", 364, 10.3, 1.0, 76.3, 2.7, false],
  ["lentils-cooked", "Lentils, cooked", "Linsen, gekocht", "Sočivo, kuvano", "Сочиво, кувано", 116, 9.0, 0.4, 20.1, 7.9, true],
  ["chickpeas-cooked", "Chickpeas, cooked", "Kichererbsen, gekocht", "Leblebije, kuvane", "Леблебије, куване", 164, 8.9, 2.6, 27.4, 7.6, true],
  ["beans-white-cooked", "White beans, cooked", "Weiße Bohnen, gekocht", "Pasulj, kuvan", "Пасуљ, куван", 139, 9.7, 0.4, 25.1, 6.3, true],
  ["beans-kidney-cooked", "Kidney beans, cooked", "Kidneybohnen, gekocht", "Crveni pasulj, kuvan", "Црвени пасуљ, куван", 127, 8.7, 0.5, 22.8, 6.4, true],
  ["tofu", "Tofu, firm", "Tofu, fest", "Tofu", "Тофу", 144, 17.3, 8.7, 2.8, 2.3, true],
  ["hummus", "Hummus", "Hummus", "Humus", "Хумус", 166, 7.9, 9.6, 14.3, 6.0, true],
  // nuts, seeds, oils
  ["almonds", "Almonds", "Mandeln", "Bademi", "Бадеми", 579, 21.2, 49.9, 21.6, 12.5, true],
  ["walnuts", "Walnuts", "Walnüsse", "Orasi", "Ораси", 654, 15.2, 65.2, 13.7, 6.7, true],
  ["hazelnuts", "Hazelnuts", "Haselnüsse", "Lešnici", "Лешници", 628, 15.0, 60.8, 16.7, 9.7, true],
  ["peanuts", "Peanuts", "Erdnüsse", "Kikiriki", "Кикирики", 567, 25.8, 49.2, 16.1, 8.5, true],
  ["peanut-butter", "Peanut butter", "Erdnussbutter", "Kikiriki puter", "Кикирики путер", 588, 25.1, 50.4, 20.0, 6.0, true],
  ["sunflower-seeds", "Sunflower seeds", "Sonnenblumenkerne", "Suncokret, semenke", "Сунцокрет, семенке", 584, 20.8, 51.5, 20.0, 8.6, true],
  ["pumpkin-seeds", "Pumpkin seeds", "Kürbiskerne", "Golica, semenke bundeve", "Голица, семенке бундеве", 559, 30.2, 49.1, 10.7, 6.0, true],
  ["chia", "Chia seeds", "Chiasamen", "Čija semenke", "Чија семенке", 486, 16.5, 30.7, 42.1, 34.4, true],
  ["flax", "Flax seeds", "Leinsamen", "Laneno seme", "Ланено семе", 534, 18.3, 42.2, 28.9, 27.3, true],
  ["tahini", "Tahini", "Tahin", "Tahini", "Тахини", 595, 17.0, 53.8, 21.2, 9.3, true],
  ["olive-oil", "Olive oil", "Olivenöl", "Maslinovo ulje", "Маслиново уље", 884, 0, 100, 0, 0, true],
  ["sunflower-oil", "Sunflower oil", "Sonnenblumenöl", "Suncokretovo ulje", "Сунцокретово уље", 884, 0, 100, 0, 0, true],
  // basics
  ["sugar", "Sugar, white", "Zucker", "Šećer", "Шећер", 387, 0, 0, 100, 0, true],
  ["honey", "Honey", "Honig", "Med", "Мед", 304, 0.3, 0, 82.4, 0.2, true],
  ["jam", "Jam", "Marmelade", "Džem", "Џем", 278, 0.4, 0.1, 68.9, 1.1, true, T],
  ["dark-chocolate", "Dark chocolate, 70 %", "Zartbitterschokolade 70 %", "Crna čokolada, 70 %", "Црна чоколада, 70 %", 598, 7.8, 42.6, 45.9, 10.9, true],
  ["cocoa", "Cocoa powder, unsweetened", "Kakaopulver", "Kakao prah", "Какао прах", 228, 19.6, 13.7, 57.9, 33.2, true],
  ["ketchup", "Ketchup", "Ketchup", "Kečap", "Кечап", 101, 1.0, 0.1, 27.4, 0.3, true],
  ["mustard", "Mustard", "Senf", "Senf", "Сенф", 66, 4.4, 4.0, 5.8, 3.3, true],
  ["mayonnaise", "Mayonnaise", "Mayonnaise", "Majonez", "Мајонез", 680, 1.0, 74.9, 0.6, 0, true],
  ["ajvar", "Ajvar", "Ajvar", "Ajvar", "Ајвар", 80, 1.5, 5.0, 8.0, 2.0, true, T],
  ["tomato-passata", "Tomato passata", "Passierte Tomaten", "Pasirani paradajz", "Пасирани парадајз", 38, 1.6, 0.2, 7.0, 1.5, true, T],
];
// the groups, by the first id of each: the table is written in this order
const GROUP_STARTS: [string, string][] = [["courgette", "Vegetables"], ["apple", "Fruit"], ["egg", "Eggs, meat and fish"], ["milk-whole", "Dairy"], ["rice-white-cooked", "Grains, bread and legumes"], ["almonds", "Nuts, seeds and oils"], ["sugar", "Basics"]];
export function groupOf(id: string): string {
  let g = GROUP_STARTS[0][1];
  for (const r of R) { const hit = GROUP_STARTS.find((x) => x[0] === r[0]); if (hit) g = hit[1]; if (r[0] === id) return g; }
  return g;
}
export const GROUPS = GROUP_STARTS.map((x) => x[1]);
export const REFERENCE: RefFood[] = R.map(([id, en, de, sr, cyr, kcal, protein, fats, carbsTotal, fiber, ready, source]) => ({ id, en, de, sr, cyr, kcal, protein, fats, carbsTotal, fiber, ready, source: source ?? U }));

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/ć/g, "c").replace(/č/g, "c").replace(/š/g, "s").replace(/ž/g, "z");
// find by any name: a word start beats a substring; two characters minimum
export function findReference(query: string, limit = 6, wordStartOnly = false): RefFood[] {
  const q = fold(query.trim());
  if (q.length < 2) return [];
  const score = (r: RefFood) => {
    const names = [r.en, r.de, r.sr, r.cyr].map(fold);
    let best = 0;
    for (const n of names) {
      if (n === q) best = Math.max(best, 100);
      else if (n.startsWith(q)) best = Math.max(best, 80);
      else if (n.split(/[\s,()]+/).some((w) => w.startsWith(q))) best = Math.max(best, 60);
      else if (!wordStartOnly && n.includes(q)) best = Math.max(best, 30);
    }
    return best;
  };
  // ties keep the table's order: the plain form is listed before the cooked one, so "egg, whole" comes before "egg, boiled"
  return REFERENCE.map((r, i) => ({ r, s: score(r), i })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s || a.i - b.i).slice(0, limit).map((x) => x.r);
}
// the local name for where the person shops: Serbia gets the Serbian name, German-speaking shops the German, else English
export function localName(r: RefFood, region: string | null | undefined): string {
  if (!region) return r.en;
  if (/belgrade|serbia|novi|nis|srb/i.test(region)) return r.sr;
  if (/munich|berlin|vienna|zurich|germany|austria|switzerland|de|at|ch/i.test(region)) return r.de;
  return r.en;
}
// a reference food as a library food, values per 100 g, carbohydrate without fibre
export function referenceFood(r: RefFood, region: string | null | undefined, uid: () => string): Food {
  const name = localName(r, region);
  return {
    id: uid(), name, brand: "", basis: "100g", calories: r.kcal, protein: r.protein, fats: r.fats, carbs: Math.max(0, Math.round((r.carbsTotal - r.fiber) * 10) / 10), fiber: r.fiber,
    readyToEat: r.ready, notes: `Reference table: ${r.source}. Per 100 g${/raw|sirov|roh|sveže/i.test(name) ? ", raw" : ""}. Carbohydrate without fibre. Also: ${[r.en, r.de, r.sr, r.cyr].filter((x) => x !== name).join(" · ")}.`,
    source: "Reference table", reviewedAt: new Date().toISOString(),
  } as Food;
}
