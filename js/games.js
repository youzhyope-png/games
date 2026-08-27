/* ============================================================
   1. GAME DATA  —  the single source of truth.
   To ship a real game, change nothing but `gameUrl`:
       gameUrl: "COMING_SOON"   ->   gameUrl: "games/neon-drift/index.html"
   Every view reads from this array. No card is hard-coded.
   ============================================================ */
const GAMES = [
  {id:"snow-rider-3d",title:"Snow Rider 3D",category:"Racing",tags:["snow","racing","3d","winter"],playCount:0,featured:true,isNew:true,gameUrl:"https://www.hoodamath.com/mobile/games/snow-rider-3d/game.html?nocheckorient=1",
   description:"Ride the snowy slopes, dodge obstacles, and see how far you can make it."}
  ,{id:"soflo-wheelie-life",title:"Soflo Wheelie Life",category:"Racing",tags:["motorcycle","wheelie","racing","3d"],playCount:0,featured:true,isNew:true,gameUrl:"https://www.hoodamath.com/mobile/games/soflo-wheelie-life/game.html?nocheckorient=1",
   description:"Keep the bike balanced, pop wheelies, and ride as far as you can."}
];

const CATEGORIES = ["All","Action","Arcade","Racing","Adventure","Puzzle","Sports","Strategy","Horror","Simulation","Platformer","Casual"];

const DISCORD_URL = "#/"; // <- drop the real invite link here later

