const cloudFrontCache = true
exports.bucketRoot = exports.cloudFrontCache ?
  "https://www.inphood.com" :
  "https://s3-us-west-1.amazonaws.com/www.inphood.com"


exports.testUsers = ['1547345815338571', '1322516797796635', '1526909420717220']  // AC, PBJ on sugarinfoAI (and sugarinfoAITest)

exports.featureTips = [
  "",
  "It’s been a while and I’ve improved a lot!",
  "You can send me a picture of the UPC label to check for hidden processed sugars.",
  "Great, but don't hesitate to send me the name or photo of the next thing you eat or drink!",
]

exports.breakfastAlerts = [
  "",
  "Have you eaten breakfast lately?",
  "Want to tell me what you ate for breakfast?",
  "Ready to tell me about your breakfast?",
  "Do you have any breakfast updates for me?",
  "You know what would make the day go by faster, tracking your breakfast!",
]

exports.lunchAlerts = [
  "",
  "Have you eaten lunch lately?",
  "Want to tell me what you ate for lunch?",
  "Ready to tell me about your lunch?",
  "Do you have any lunch updates for me?",
  "You know what would make the day go by faster, tracking your lunch!",
]

exports.dinnerAlerts = [
  "",
  "Have you eaten dinner lately?",
  "Want to tell me what you ate for dinner?",
  "Ready to tell me about your dinner?",
  "Do you have any dinner updates for me?",
  "You know what would make the day go by faster, tracking your dinner!",
]

exports.defaultAlerts = [
  "",
  "Have you eaten lately?",
  "Want to tell me what you ate?",
  "Ready to tell me about your last meal?",
  "Do you have any food or drink updates for me?",
  "You know what would make the day go by faster, tracking your meal!",
]

exports.reminderTips = [
  "",
  "Add healthy vegetable fats to your diet.",
  "Eat regularly to optimize your metabolism.",
  "Try listening to your hunger cues and eating with them.",
  "Pause between bites and see if you are not already full.",
  "Three months from now you’ll be proud you stuck to it today.",
  "Use the red, orange and green rule, a vegetable from each group.",
  "Make sure that at least 1/4 of your plate is filled with veggies.",
  "Whole grains are full of vitamins and will keep you full for longer.",
  "Water is essential for keeping the body hydrated, try to drink 64 ounces everyday.",
  "Consistency is the key to success, so don’t forget to tell me about your food and drinks.",
  "When you overestimate the calories you burn during exercise, you may eat more than you need.",
  "Research shows that people who eat regularly are on average leaner than people who skip it.",
  "Keeping a food journal can help you measure progress, identify triggers and hold yourself accountable.",
  "Adding hot spices to your meals can help curb hunger, according to a study in the British Journal of Nutrition.",
  "Meals with healthy carbs, protein, and fat delivers better energy and fat loss results by giving the body what it needs",
  "Stay hydrated by drinking water instead of sugary drinks. Keep a reusable water bottle with you to always have water on hand.",
  "Eat slowly, it takes 20 minutes for your stomach to send a message to your brain that you have eaten enough and are satisfied.",
  "Science tells us that the best way to control ghrelin (hunger hormone) is to eat small, balanced meals about every 3 hours or so.",
  "Deep breaths take you out of your immersion in momentary stress, oxygenate your brain and tissues, and they help to reduce stress hormones.",
  "Foods like fat-free and low-fat milk, cheese, yogurt, and fortified soy beverages (soymilk) help to build and maintain strong bones needed for everyday activities.",
  "Eating with chopsticks takes more time because you have to closely watch each bite so the food doesn’t fall off. They can act as a reminder to slow down, savor and chew consciously.",
]

exports.encouragingTips = [
  "Diet Tip: set realistic goals for diet success",
  "Diet Tip: forming a habit is the easiest way to do difficult things.",
  "Diet Tip: success entails making real lifestyle changes, and that doesn't happen overnight.",
  "Diet Tip: finding other people with similar goals can greatly improve yours odds of diet success.",
  "Diet Tip: be patient. One of the biggest diet motivation-busters is the dreaded weight loss plateau.",
  "Diet Tip: preventive Medicine found that those who kept regular food records lost twice as much weight as those who didn't.",
  "Diet Tip: don't be a perfectionist. Bottom line when you slip up: don't dwell on it. Tomorrow is a new (healthier) day",
  "Diet Tip: people who have positive expectations and feel confident in their ability to achieve their goals tend to lose more weight",
  "Diet Tip: everyone is bound to give in to temptations. The danger isn't a single splurge but letting it become an excuse for an all-out binge.",
  "Diet Tip: remember to reward yourself. Dieting is hard work -- and it's not always a whole lot of fun. Small rewards can provide an incentive to keep going.",
]

exports.sugarFacts = [
  {
    fact: 'Sugar is one of the world’s oldest ingredients. The people of New Guinea were most likely the first to domesticate sugar cane around 8000 B.C.',
    source: 'Source: Macinnis, Peter. Bittersweet: The Story of Sugar. Crows Nest, Australia: McPherson’s Printing Group, 2002.'
  },
  {
    fact: 'In the 16th century, a teaspoon of sugar cost the equivalent of five dollars in London.',
    source: 'Source: Macinnis, Peter. Bittersweet: The Story of Sugar. Crows Nest, Australia: McPherson’s Printing Group, 2002.'
  },
  {
    fact: 'The word “sugar” originates from the Sanskrit word sharkara, which means “material in a granule form.” In Arabic, it is sakkar; Turkish is sheker; Italian is zucchero; and Yoruba speakers in Nigeria call it suga.',
    source: 'Source: Chapman, Garry and Gary Hodges. Sugar World (Commodities). Mankato, MN: Smart Apple Media, 2011'
  },
  {
    fact: 'The American Heart Association recommends that adult women eat no more than 24 grams, or 6 teaspoons, of added (beyond naturally occurring sugar) sugar and men no more than 36 grams, or 9 teaspoons, per day. The current average is over 30 teaspoons of sugar per day.',
    source: 'Source: https://www.hsph.harvard.edu/nutritionsource/carbohydrates/added-sugar-in-the-diet/'
  },
  {
    fact: 'The only taste humans are born craving is sugar.',
    source: 'Source: O’Connell, Jeff. Sugar Nation: The Hidden Truth behind America’s Deadliest Habit and the Simple Way to Beat It. New York, NY: Hyperion, 2010.'
  },
  {
    fact: 'The tallest sugar cube tower measured 6 feet, 10 inches and was built by Camille Courgeon of France on July 1, 2013. The tower used 2,669 cubes and was built in 2 hours and 59 minutes.',
    source: 'Source: http://www.guinnessworldrecords.com/world-records/tallest-sugar-cube-tower'
  },
  {
    fact: 'In 1822, the average American ate 45 grams of sugar—which is the amount in one of today’s 12 oz. sodas—every five days. In 2012, Americans consumed 765 grams of sugar every five days.',
    source: 'Source: https://www.hsph.harvard.edu/nutritionsource/carbohydrates/added-sugar-in-the-diet/'
  },
  {
    fact: 'Heinz ketchup contains 1 teaspoon of sugar in each 1 tablespoon serving.',
    source: 'Source: O’Connell, Jeff. Sugar Nation: The Hidden Truth behind America’s Deadliest Habit and the Simple Way to Beat It. New York, NY: Hyperion, 2010.'
  },
  {
    fact: 'Worldwide, people consume 500 extra calories a day from sugar, which is roughly the amount of calories needed to gain a pound a week.',
    source: 'Source: http://www.huffingtonpost.com/laura-kumin/shocking-sugar-facts_b_5455137.html'
  },
  {
    fact: 'Too much sugar can increase the overall risk for heart disease. In fact, sugar actually changes the muscle protein of the heart as well as the pumping mechanics of the heart.',
    source: 'Source: O’Connell, Jeff. Sugar Nation: The Hidden Truth behind America’s Deadliest Habit and the Simple Way to Beat It. New York, NY: Hyperion, 2010.'
  },
  {
    fact: 'Christopher Columbus introduced sugar cane seeds to the New World, specifically to Hispaniola, on his second voyage in 1493.',
    source: 'Source: Macinnis, Peter. Bittersweet: The Story of Sugar. Crows Nest, Australia: McPherson’s Printing Group, 2002.'
  },
  {
    fact: 'Excess sugar consumption has been linked to cancer production. Studies have found that high sugar intake negatively affects the survival rates in both breast cancer patients and colon cancer patients.',
    source: 'Source: http://www.huffingtonpost.com/kristin-kirkpatrick-ms-rd-ld/dangers-of-sugar_b_3658061.html'
  },
  {
    fact: 'Sugar addiction may be genetic. Studies show that those who had genetic changes in a hormone called ghrelin consume more sugar (and alcohol) than those who had no gene variation.',
    source: 'Source: http://discovermagazine.com/2009/oct/30-20-things-you-didnt-know-about-sugar'
  },
  {
    fact: 'Sugar and alcohol have similar toxic liver effects. Additionally, liver damage can occur even without excess calories or weight gain.',
    source: 'Source: http://www.huffingtonpost.com/kristin-kirkpatrick-ms-rd-ld/dangers-of-sugar_b_3658061.html'
  },
  {
    fact: 'A 2009 study found that glucose consumption accelerated the aging of cells in the body. Additionally, a 2012 study found that excess sugar consumption was tied to deficiencies in memory and overall cognitive processing.',
    source: 'Source: http://www.huffingtonpost.com/kristin-kirkpatrick-ms-rd-ld/dangers-of-sugar_b_3658061.html'
  },
  {
    fact: 'Sugar is found in unlikely places, such as tonic water, marinades, crackers, bread, fat-free dressing, and tomato sauce.',
    source: 'Source: Chapman, Garry and Gary Hodges. Sugar World (Commodities). Mankato, MN: Smart Apple Media, 2011'
  },
  {
    fact: 'A 2013 study found that at least 180,000 deaths worldwide are linked to sweetened-beverage consumption. The U.S. alone accounted for 25,000 deaths in 2010.',
    source: 'Source: https://www.forbes.com/sites/alicegwalton/2012/08/30/how-much-sugar-are-americans-eating-infographic/#1c011ef64ee7'
  },
  {
    fact: 'While foods rich in fiber, fat, and protein help make a person feel full, sugar does not create feelings of satiety.',
    source: 'Source: Chapman, Garry and Gary Hodges. Sugar World (Commodities). Mankato, MN: Smart Apple Media, 2011'
  },
  {
    fact: 'One 20 oz. bottle of Coca Cola has 65 grams of sugar. This is the same amount of sugar in five Little Debbie Swiss Rolls.',
    source: 'Source: http://www.cnn.com/2014/07/02/health/gallery/sugar-sweetened-beverages/'
  },
  {
    fact: 'A 15.2 oz. bottle of Minute Maid 100% Apple Juice contains 49 grams of sugar. This is about the same amount of sugar in 10 Oreos.',
    source: 'Source: http://www.cnn.com/2014/07/02/health/gallery/sugar-sweetened-beverages/'
  },
  {
    fact: 'A 23 oz. bottle of Arizona Green Tea has about 51 grams of sugar, which is about the same as eating 20 Hershey’s Kisses.',
    source: 'Source: http://www.cnn.com/2014/07/02/health/gallery/sugar-sweetened-beverages/'
  },
  {
    fact: 'A 16 oz. can of Monster Energy has 54 ounces of sugar, which is the same amount of sugar as 3.5 cups of Frosted Flakes.',
    source: 'Source: http://www.cnn.com/2014/07/02/health/gallery/sugar-sweetened-beverages/'
  },
  {
    fact: 'A 32 oz. Gatorade bottle has 36 grams of sugar, which is like eating 5 Reese’s Peanut Butter Cups.',
    source: 'Source: http://www.cnn.com/2014/07/02/health/gallery/sugar-sweetened-beverages/'
  },
  {
    fact: 'A Grande Starbucks Iced Flavored drink has about 28 grams of sugar, which is the same amount of sugar in 2.5 Krispy Kreme donuts.',
    source: 'Source: http://www.cnn.com/2014/07/02/health/gallery/sugar-sweetened-beverages/'
  },
  {
    fact: 'Lemons have more sugar than strawberries.',
    source: 'Source: O’Connell, Jeff. Sugar Nation: The Hidden Truth behind America’s Deadliest Habit and the Simple Way to Beat It. New York, NY: Hyperion, 2010.'
  },
  {
    fact: 'Sugar threatens more than thin waistlines. It has also been associated with several conditions and diseases, including type 2 diabetes, arthritis, acne, heart disease, depression, thrush/yeast infections, and cancer.',
    source: 'Source: http://www.huffingtonpost.com/kristin-kirkpatrick-ms-rd-ld/dangers-of-sugar_b_3658061.html'
  },
  {
    fact: 'More than half of the 8.4 million metric tons of sugar that is produced in the United States each year comes from sugar beets.',
    source: 'Source: http://www.dhhs.nh.gov/dphs/nhp/documents/sugar.pdf'
  },
  {
    fact: 'The scientists who discovered sucralose (Splenda) were trying to make an insecticide. An assistant thought he had been instructed to “taste” a sample he had been asked to “test.”',
    source: 'Source: http://discovermagazine.com/2009/oct/30-20-things-you-didnt-know-about-sugar'
  },
  {
    fact: 'The sweetest compound known is called lugduname. It’s over 20,000 times sweeter than sugar.',
    source: 'Source: http://discovermagazine.com/2009/oct/30-20-things-you-didnt-know-about-sugar'
  },
  {
    fact: 'Sugar is everywhere. It is the building blocks of carbohydrates, the most abundant type of organic molecules in living things. Researchers note that sugar is not necessarily a health problem, but the amount of sugar we consume is.',
    source: 'Source: http://www.cnn.com/2014/02/11/opinion/briscoe-sugar-getting-it-wrong/'
  },
  {
    fact: 'One teaspoon of white sugar has 15 calories and one teaspoon of corn syrup (a type of sugar) has 20 calories. Soft drinks are responsible for most of the added sugar in the average American diet.',
    source: 'Source: http://www.cnn.com/2014/03/06/health/who-sugar-guidelines/'
  },
  {
    fact: 'Two hundred years ago, the average American ate only 2 pounds of sugar a year. In 1970, Americans ate 123 pounds of sugar per year. Today the average American consumes almost 152 pounds of sugar in one year. This is equal to 3 pounds (or 6 cups) of sugar consumed in one week.',
    source: 'Source: http://www.dhhs.nh.gov/dphs/nhp/documents/sugar.pdf'
  },
  {
    fact: 'The World Health Organization (WHO) recommends people consume less sugar than is found in one regular soda per day.',
    source: 'Source: http://www.cnn.com/2014/03/06/health/who-sugar-guidelines/'
  },
  {
    fact: 'Just one 12 oz. can of soda a day adds enough sugar to a person’s diet to boost their odds of developing heart disease by one third.',
    source: 'Source: http://www.cnn.com/2014/03/06/health/who-sugar-guidelines/'
  },
  {
    fact: 'Americans consume most sugar (33%) through regular soft drinks, followed by sugars and candy (16.1%); cakes, cookies, and pies (12.9%); fruit drinks (9.7%); dairy desserts and milk (8.6%); and other grains (5.8%).',
    source: 'Source: http://www.cnn.com/2014/07/02/health/gallery/sugar-sweetened-beverages/'
  },
  {
    fact: 'One 12 oz. can of Coke has 10 teaspoons of sugar, which is more sugar than 2 frosted Pop Tarts and a Twinkie combined.',
    source: 'Source: http://www.cnn.com/2014/07/02/health/gallery/sugar-sweetened-beverages/'
  },
  {
    fact: 'The average American consumes 53 gallons of soft drinks per year.',
    source: 'Source: http://www.cnn.com/2014/07/02/health/gallery/sugar-sweetened-beverages/'
  },
  {
    fact: 'In the American diet, added sugar accounts for nearly 500 calories every day. This is equivalent to eating 10 strips of bacon every day.',
    source: 'Source: https://www.forbes.com/sites/alicegwalton/2012/08/30/how-much-sugar-are-americans-eating-infographic/#1c011ef64ee7'
  },
  {
    fact: 'Americans eat 10 times more sugar than all other food additives—except for salt.',
    source: 'Source: Chapman, Garry and Gary Hodges. Sugar World (Commodities). Mankato, MN: Smart Apple Media, 2011'
  },
  {
    fact: 'To find the amount of calories from sugar in a product, multiply the grams by 4. For example, a product containing 15 grams of sugar has 60 calories from sugar per serving.',
    source: 'Source: https://www.hsph.harvard.edu/nutritionsource/carbohydrates/added-sugar-in-the-diet/'
  },
  {
    fact: 'Sugar can take several forms, including sucrose, fructose, and lactose. Sucrose is the most commonly used form of sugar and is usually called table sugar.',
    source: 'Source: http://www.cnn.com/2014/02/11/opinion/briscoe-sugar-getting-it-wrong/'
  },
  {
    fact: 'The average American consumes 3 pounds of sugar each week—or 3,550 pounds in an entire lifetime. This is equivalent to about 1,767,900 Skittles, which is enough sugar to fill an industrialized dumpster.',
    source: 'Source: https://www.forbes.com/sites/alicegwalton/2012/08/30/how-much-sugar-are-americans-eating-infographic/#1c011ef64ee7'
  },
  {
    fact: 'Many cereals for children, such as Fruit Loops, contain one spoonful of sugar for every three spoonfuls of cereal eaten. Often the least healthful cereals are marketed the most aggressively, even to kids as young as 2 years old.',
    source: 'Source: http://www.medicalnewstoday.com/articles/246996.php'
  },
  {
    fact: 'Two different types of plants provide the world with most of its sugar: sugar cane and sugar beet. Sugar cane is grown in tropical and subtropical regions. Sugar beet is grown in temperate climates, such as parts of Europe, Japan, and the United States.',
    source: 'Source: Macinnis, Peter. Bittersweet: The Story of Sugar. Crows Nest, Australia: McPherson’s Printing Group, 2002.'
  },
  {
    fact: 'About 70% of all sugar produced is used in its country of origin. More than 100 countries produce sugar commercially.',
    source: 'Source: Macinnis, Peter. Bittersweet: The Story of Sugar. Crows Nest, Australia: McPherson’s Printing Group, 2002.'
  },
  {
    fact: 'Brazil is the world’s largest producer of sugar cane.',
    source: 'Source: Macinnis, Peter. Bittersweet: The Story of Sugar. Crows Nest, Australia: McPherson’s Printing Group, 2002.'
  },
  {
    fact: 'India is the world’s largest consumer of sugar.',
    source: 'Source: Chapman, Garry and Gary Hodges. Sugar World (Commodities). Mankato, MN: Smart Apple Media, 2011'
  },
  {
    fact: 'Sugar cane is usually grown in large plantations or cane fields. It can yield up to 44 pounds (20 kg) of sugar for every 11 square feet (1 square m) of land.',
    source: 'Source: Chapman, Garry and Gary Hodges. Sugar World (Commodities). Mankato, MN: Smart Apple Media, 2011'
  },
  {
    fact: 'Sugar is useful in cooking: it helps cakes and bread rise, prevents food from spoiling, keeps the color of fruit by holding water, and brings out the flavor in many different foods.',
    source: 'Source: Macinnis, Peter. Bittersweet: The Story of Sugar. Crows Nest, Australia: McPherson’s Printing Group, 2002.'
  },
  {
    fact: 'The sugar trade is one of the most complex in the world and involves price controls, quotas, subsidies, and preferential arrangements.',
    source: 'Source: Macinnis, Peter. Bittersweet: The Story of Sugar. Crows Nest, Australia: McPherson’s Printing Group, 2002.'
  },
  {
    fact: 'The world sugar trade is regulated by the World Trade Organization (WTO), which helps ensure any business between the countries is conducted fairly.',
    source: 'Source: Macinnis, Peter. Bittersweet: The Story of Sugar. Crows Nest, Australia: McPherson’s Printing Group, 2002.'
  },
  {
    fact: 'One of the most important agreements governing the sugar trade is the Anti-Dumping Agreement, which tries to prevent large sugar producers, such as the U.S. and Europe, from dumping their surplus sugar on the world market at low prices.',
    source: 'Source: Macinnis, Peter. Bittersweet: The Story of Sugar. Crows Nest, Australia: McPherson’s Printing Group, 2002.'
  },
  {
    fact: 'There are at least 115 names for sugar in its many forms and for other types of sweeteners. To avoid listing “sugar” as the first ingredient, food manufactures may use a different name.',
    source: 'Source: http://www.huffingtonpost.com/laura-kumin/shocking-sugar-facts_b_5455137.html'
  },
  {
    fact: 'Sugar has been shown to cause wrinkles via glycation, which happens when excess blood sugar binds to collagen in the skin and makes it less elastic.',
    source: 'Source: http://discovermagazine.com/2009/oct/30-20-things-you-didnt-know-about-sugar'
  },
  {
    fact: 'Until the late 1500s, sugar was called “White Gold,” and European nobility used it to display their social standing. After about 1600 on, technological improvements and New World sources helped turn sugar into a bulk commodity.',
    source: 'Source: Macinnis, Peter. Bittersweet: The Story of Sugar. Crows Nest, Australia: McPherson’s Printing Group, 2002.'
  },
  {
    fact: 'Four grams of sugar equal 1 teaspoon of sugar. So, for example, the cereal Cocoa Puffs has 10 grams, or 2½ teaspoons, of sugar in each ¾ cup serving.',
    source: 'Source: https://www.forbes.com/sites/alicegwalton/2012/08/30/how-much-sugar-are-americans-eating-infographic/#1c011ef64ee7'
  },
  {
    fact: 'Ralf Schroder of Germany holds the Guinness World Record for the largest collection of sugar packets as of May 14, 2013. He owns 14,502 different sugar packets, the oldest of which dates back to the 1950s.',
    source: 'Source: http://www.guinnessworldrecords.com/world-records/largest-collection-of-sugar-packets/'
  },
  {
    fact: 'Originally, people would chew sugar cane raw for its sweetness. Indians were the first to crystallize sugar during the Gupta dynasty around A.D. 350.',
    source: 'Source: Macinnis, Peter. Bittersweet: The Story of Sugar. Crows Nest, Australia: McPherson’s Printing Group, 2002.'
  },
  {
    fact: 'Crusaders were the first to introduce sugar to Europe after they encountered caravans carrying “sweet salt.”',
    source: 'Source: Macinnis, Peter. Bittersweet: The Story of Sugar. Crows Nest, Australia: McPherson’s Printing Group, 2002.'
  },
  {
    fact: 'In the United States and Japan, high-fructose corn syrup is used in place of sugar in many instances, especially in soft drinks and processed foods.',
    source: 'Source: O’Connell, Jeff. Sugar Nation: The Hidden Truth behind America’s Deadliest Habit and the Simple Way to Beat It. New York, NY: Hyperion, 2010.'
  },
  {
    fact: 'When the body cannot clear glucose, or sugar, quickly enough, sugar destroys tissue. This is basically what diabetes is: the inability to eliminate glucose.',
    source: 'Source: O’Connell, Jeff. Sugar Nation: The Hidden Truth behind America’s Deadliest Habit and the Simple Way to Beat It. New York, NY: Hyperion, 2010.'
  },
  {
    fact: 'The percentage of total calories from added sugars decreases linearly with increasing income for men and women. In other words, people living in poverty are more likely to eat more added sugar than their wealthier counterparts.',
    source: 'Source: https://www.cdc.gov/nchs/data/databriefs/db122.htm'
  },
  {
    fact: 'Men consume a larger absolute amount of calories from added sugars than women, but not when their added sugars intakes were expressed as a percentage of total calories. The percentage of calories from added sugars declines with increasing age and income.',
    source: 'Source: https://www.cdc.gov/nchs/data/databriefs/db122.htm'
  },
  {
    fact: 'According to brain scans, sugar is as addictive as cocaine.',
    source: 'Source: https://www.forbes.com/sites/alicegwalton/2012/08/30/how-much-sugar-are-americans-eating-infographic/#1c011ef64ee7'
  },
  {
    fact: 'Non-Hispanic black men and women ate a larger percentage of calories from added sugars than non-Hispanic white or Mexican American men and women.',
    source: 'Source: https://www.cdc.gov/nchs/data/databriefs/db122.htm'
  },
  {
    fact: 'Researchers found that people who drink 2.5 cans of sugary soda daily are three times more likely to be depressed and anxious than those who drink less.',
    source: 'Source: O’Connell, Jeff. Sugar Nation: The Hidden Truth behind America’s Deadliest Habit and the Simple Way to Beat It. New York, NY: Hyperion, 2010.'
  }
]

exports.sugarFreeRecipes = [
  {
    recipe: 'Raspberry Ripple',
    link: 'https://iquitsugar.com/recipe/my-raspberry-ripple/'
  },
  {
    recipe: "'Salted Caramel’ Haloumi + Apple",
    link: 'https://iquitsugar.com/recipe/salted-caramel-haloumi-apple/'
  },
  {
    recipe: 'Witlof Sardine Boats',
    link: 'https://iquitsugar.com/recipe/witlof-sardine-boats/'
  },
  {
    recipe: 'Crunchy-Nut Cheesecake',
    link: 'https://iquitsugar.com/recipe/1059/'
  },
  {
    recipe: 'Coco-Nutty Granola',
    link: 'https://iquitsugar.com/recipe/coco-nutty-granola/'
  },
  {
    recipe: 'Choc Berry Mud',
    link: 'https://iquitsugar.com/recipe/choc-berry-mud/'
  },
  {
    recipe: 'Pumpkin + Chia Muffins',
    link: 'https://iquitsugar.com/recipe/pumpkin-chia-muffins/'
  },
  {
    recipe: 'Bacon + Egg Cupcakes',
    link: 'https://iquitsugar.com/recipe/bacon-egg-cupcakes/'
  },
  {
    recipe: 'Almond Butter Bark',
    link: 'https://iquitsugar.com/recipe/almond-butter-bark/'
  },
  {
    recipe: 'Spicy Activated Nuts',
    link: 'https://iquitsugar.com/recipe/activated-spicy-nuts/'
  },
  {
    recipe: 'Chilli Tempeh Satay Tacos',
    link: 'https://iquitsugar.com/recipe/chilli-tempeh-satay-tacos/'
  },
  {
    recipe: 'Chilli Bacon + Eggs with Sweet Potato Hash',
    link: 'https://iquitsugar.com/recipe/chilli-bacon-eggs-with-sweet-potato-hash/'
  },
  {
    recipe: 'Spirulina Superfood Quinoa Salad',
    link: 'https://www.mindbodygreen.com/0-10773/gluten-free-recipe-spirulina-superfood-quinoa-salad.html'
  },
  {
    recipe: 'Turmeric Latte',
    link: 'https://www.mindbodygreen.com/0-24409/a-tasty-turmeric-latte-for-immunity.html'
  },
  {
    recipe: 'Grain-Free, Omega-Rich Flaxseed Bread Recipe',
    link: 'https://www.mindbodygreen.com/0-10551/grain-free-omega-rich-flaxseed-bread-recipe.html'
  },
  {
    recipe: 'Turmeric Smoothie With Bee Pollen',
    link: 'https://www.mindbodygreen.com/0-17971/healing-warming-turmeric-smoothie-with-bee-pollen.html'
  },
  {
    recipe: 'Quick Quinoa Fried "Rice"',
    link: 'https://www.mindbodygreen.com/0-20340/cook-this-for-dinner-tonight-quick-quinoa-fried-rice.html'
  },
  {
    recipe: 'Garlic Naan Recipe',
    link: 'https://www.mindbodygreen.com/0-24900/a-turmeric-garlic-naan-recipe-thats-surprise-gluten-free.html'
  },
  {
    recipe: 'Zesty Lemon Poppy Seed Bread',
    link: 'https://www.mindbodygreen.com/0-26317/zesty-lemon-poppy-seed-bread-youll-never-believe-is-paleo-vegan-gluten-free.html'
  },
  {
    recipe: 'Poached Salmon With Bacon',
    link: 'https://www.mindbodygreen.com/0-24791/a-simple-delicious-salmon-dinner-that-only-takes-15-minutes.html'
  },
  {
    recipe: 'Perfect Green Smoothie',
    link: 'https://www.mindbodygreen.com/0-27424/bookmark-this-the-only-formula-you-need-for-a-perfect-green-smoothie-every-time.html'
  },
  {
    recipe: 'Creamy Buffalo Chicken Pasta',
    link: 'http://livinglovingpaleo.com/2016/05/20/creamy-buffalo-chicken-pasta/'
  },
  {
    recipe: 'Yogurt Chicken Curry',
    link: 'http://www.chefdehome.com/Recipes/736/yogurt-chicken-curry'
  },
  {
    recipe: 'Taco Stuffed Sweet Potato',
    link: 'http://www.spinach4breakfast.com/taco-stuffed-sweet-potato/'
  },
  {
    recipe: 'Chicken, Sweet Potato, and Coconut Stew',
    link: 'http://www.chewoutloud.com/2017/01/19/chicken-sweet-potato-and-coconut-stew/'
  },
  {
    recipe: 'Easy 30-Minute Turkey Chili',
    link: 'https://www.averiecooks.com/2017/02/easy-30-minute-turkey-chili.html#'
  },
  {
    recipe: 'Weeknight Sesame Steak Salad',
    link: 'http://pdxfoodlove.com/2017/01/13/weeknight-sesame-steak-salad/'
  },
  {
    recipe: 'Peanut Broccoli and Pork Stir-Fry',
    link: 'http://www.nutritionistreviews.com/2017/02/peanut-broccoli-pork-stir-fry.html'
  },
  {
    recipe: 'One-Pot Beef and Tomato Macaroni Soup',
    link: 'http://www.thereciperebel.com/one-pot-beef-and-tomato-macaroni-soup/'
  },
  {
    recipe: "Grandma's One-Pan Hamburger Helper",
    link: 'http://www.theseasonedmom.com/grandmas-one-pan-hamburger-helper/'
  },
  {
    recipe: 'Spring Pea Resotto',
    link: 'http://www.kiwiandcarrot.com/spring-pea-risotto/'
  },
  {
    recipe: 'Yellow Rice Pork Chop Bake',
    link: 'https://fooddonelight.com/yellow-rice-pork-chop-bake/'
  },
  {
    recipe: 'Baked Pesto Salmon',
    link: 'http://skinnyfitalicious.com/baked-pesto-salmon/'
  },
  {
    recipe: 'Avocado Tuna Cakes',
    link: 'http://www.wellplated.com/tuna-cakes/'
  },
  {
    recipe: 'Pineapple Chipotle Salmon Tostadas',
    link: 'http://www.joyfulhealthyeats.com/pineapple-chipotle-salmon-tostadas/'
  },
  {
    recipe: 'Cajun Shrimp and Rice',
    link: 'http://www.everydayeasyeats.com/cajun-shrimp-and-rice-recipe/'
  },
  {
    recipe: 'Shrimp, Orzo, Spinach, and Feta Casserole',
    link: 'http://www.thestraightdish.com/shrimp-orzo-spinach-and-feta-casserole-sunday-dinner/'
  },
  {
    recipe: 'Panfried Halibut With Grapefruit and Mango Salsa',
    link: 'http://cookswithcocktails.com/perfectly-panfried-halibut-with-grapefruit-mango-salsa/'
  },
  {
    recipe: 'Easy Tilapia Pomodoro',
    link: 'http://mylifecookbook.com/2014/08/15/easy-tilapia-pomodoro-dinner/'
  },
  {
    recipe: 'Garlic Asparagus Artichoke Pasta',
    link: 'http://pumpkinandpeanutbutter.com/2017/03/28/garlic-asparagus-artichoke-pasta/'
  },
  {
    recipe: 'Pad Thai Zucchini Noodle Quinoa Salad',
    link: 'https://www.simplyquinoa.com/pad-thai-zucchini-noodle-quinoa-salad/'
  },
  {
    recipe: 'Vegetable Samosa Bowl',
    link: 'http://www.kristinkitchen.com/blog/2017/2/26/vegetable-samosa-bowl'
  },
  {
    recipe: 'Easy Tempeh Fajitas',
    link: 'http://bbritnell.com/easy-tempeh-fajitas/'
  },
  {
    recipe: 'Lentil Sloppy Joes',
    link: 'http://modernlittlevictories.com/2017/02/27/lentil-sloppy-joes-vegan-gf/'
  }
]

exports.generateTip = function() {
  //encouraging tips
  //reminder tips
  //sugar facts
  //sugar recipes
  const pool = exports.reminderTips.length + exports.encouragingTips.length + exports.sugarFacts.length + exports.sugarFreeRecipes.length
  const random = Math.floor(Math.random()*pool)
  console.log("Random", random)
  if (random < exports.reminderTips.length) {
    return 'Daily Tip: ' + exports.reminderTips[random]
  }
  else if (random < exports.reminderTips.length + exports.encouragingTips.length) {
    return exports.encouragingTips[random - exports.reminderTips.length]
  }
  else if (random < exports.reminderTips.length + exports.encouragingTips.length + exports.sugarFacts.length) {
    return 'Sugar Fact: '
     + exports.sugarFacts[random - exports.reminderTips.length - exports.encouragingTips.length].fact
     + " " + exports.sugarFacts[random - exports.reminderTips.length - exports.encouragingTips.length].source
  }
  else if (random < exports.reminderTips.length + exports.encouragingTips.length + exports.sugarFacts.length + exports.sugarFreeRecipes.length) {
    return 'Sugar Free Recipe: '
     + exports.sugarFreeRecipes[random - exports.reminderTips.length - exports.encouragingTips.length - exports.sugarFacts.length].recipe
     + " " + exports.sugarFreeRecipes[random - exports.reminderTips.length - exports.encouragingTips.length - exports.sugarFacts.length].link
  }
  else {
    return ""
  }
}
