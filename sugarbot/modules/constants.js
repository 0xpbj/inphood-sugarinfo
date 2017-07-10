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
  "Daily tip: Add healthy vegetable fats to your diet.",
  "Daily tip: Eat regularly to optimize your metabolism.",
  "Daily tip: Try listening to your hunger cues and eating with them.",
  "Daily tip: Pause between bites and see if you are not already full.",
  "Daily tip: Three months from now you’ll be proud you stuck to it today.",
  "Daily tip: Use the red, orange and green rule, a vegetable from each group.",
  "Daily tip: Make sure that at least 1/4 of your plate is filled with veggies.",
  "Daily tip: Whole grains are full of vitamins and will keep you full for longer.",
  "Daily tip: Water is essential for keeping the body hydrated, try to drink 64 ounces everyday.",
  "Daily tip: Consistency is the key to success, so don’t forget to tell me about your food and drinks.",
  "Daily tip: When you overestimate the calories you burn during exercise, you may eat more than you need.",
  "Daily tip: Research shows that people who eat regularly are on average leaner than people who skip it.",
  "Daily tip: Keeping a food journal can help you measure progress, identify triggers and hold yourself accountable.",
  "Daily tip: Adding hot spices to your meals can help curb hunger, according to a study in the British Journal of Nutrition.",
  "Daily tip: Meals with healthy carbs, protein, and fat delivers better energy and fat loss results by giving the body what it needs",
  "Daily tip: Stay hydrated by drinking water instead of sugary drinks. Keep a reusable water bottle with you to always have water on hand.",
  "Daily tip: Eat slowly, it takes 20 minutes for your stomach to send a message to your brain that you have eaten enough and are satisfied.",
  "Daily tip: Science tells us that the best way to control ghrelin (hunger hormone) is to eat small, balanced meals about every 3 hours or so.",
  "Daily tip: Deep breaths take you out of your immersion in momentary stress, oxygenate your brain and tissues, and they help to reduce stress hormones.",
  "Daily tip: Foods like fat-free and low-fat milk, cheese, yogurt, and fortified soy beverages (soymilk) help to build and maintain strong bones needed for everyday activities.",
  "Daily tip: Eating with chopsticks takes more time because you have to closely watch each bite so the food doesn’t fall off. They can act as a reminder to slow down, savor and chew consciously.",
]

exports.encouragingTips = [
  "",
  "Hoorah! Great job! 🎉 Remember to set realistic goals for diet success",
  "Awesome! You did it! 💯 Remember forming a habit is the easiest way to do difficult things.",
  "Hoorah! Great job! 🎉 Remember diet success entails making real lifestyle changes, and that doesn't happen overnight.",
  "Awesome! You did it! 💯 Remember finding other people with similar goals can greatly improve yours odds of diet success.",
  "Hoorah! Great job! 🎉 Remember be patient. One of the biggest diet motivation-busters is the dreaded weight loss plateau.",
  "Awesome! You did it! 💯 Preventive Medicine found that those who kept regular food records lost twice as much weight as those who didn't.",
  "Hoorah! Great job! 🎉 Remember don't be a perfectionist. Bottom line when you slip up: don't dwell on it. Tomorrow is a new (healthier) day",
  "Awesome! You did it! 💯 Remember people who have positive expectations and feel confident in their ability to achieve their goals tend to lose more weight",
  "Hoorah! Great job! 🎉 Remember everyone is bound to give in to temptations. The danger isn't a single splurge but letting it become an excuse for an all-out binge.",
  "Awesome! You did it! 💯 Remember to reward yourself. Dieting is hard work -- and it's not always a whole lot of fun. Small rewards can provide an incentive to keep going.",
]

exports.generateTip = function(arr) {
  return arr[Math.floor(Math.random()*(arr.length-1)+1)]
}