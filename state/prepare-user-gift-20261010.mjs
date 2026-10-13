import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { encode, hash, mergeMailboxes, validateDocument } from '../../.worktrees/feedback-announcement-watch/scripts/questnote-watch-core.mjs';
import { validateMailboxDocument } from '../../.worktrees/feedback-announcement-watch/src/mailboxSchema.js';
const root = 'C:/Users/User/OneDrive/questnote-pwa/.worktrees/feedback-announcement-watch';
const directory = 'C:/Users/User/OneDrive/questnote-pwa/.dev-backups/questnote-watch';
const scan = JSON.parse(fs.readFileSync(directory + '/scan.json', 'utf8'));
if (scan.incompleteDecisions.length || scan.pending.length) throw new Error('Resolve pending decisions before this manual gift');
const git = (...args) => execFileSync('git', args, {cwd:root,encoding:'utf8'}).trim();
if (git('rev-parse','origin/main') !== scan.mainCommit || git('rev-parse','origin/gh-pages') !== scan.pagesCommit) throw new Error('Stale scan');
const catalogs = {materials:JSON.parse(git('show','origin/main:data/materials.json')),items:JSON.parse(git('show','origin/main:data/craftables.json'))};
const now = new Date().toISOString();
const message = {
  id:'2026-10-v395-casino-stardust-gift-01', type:'compensation',
  title:'星辰賭場體驗贈禮｜送你 2,000 星塵',
  body:'親愛的旅人：\n\n星辰賭場的夥伴賽跑已開放！送上 2,000 星塵作為體驗贈禮，歡迎到任務頁信箱旁的骰子圖示看看。\n\n無須下注、完成任務或提交回報即可領取。星塵也可用於召喚等既有功能，請依自己的喜好使用。免費觀賽不扣星塵，但會使用該場次，開賽後不能補下注。\n\n若選擇下注，每天最多三場，每場可押 5～500 星塵，以 5 為級距；四位夥伴各有 25% 勝率。猜中返還 3.8 倍，包含本金；猜錯失去全部押注，三場全押滿且全輸最多損失 1,500 星塵。開賽即結算並保存，關閉畫面不會取消。\n\n請更新至 V3.9.5，在信箱點「領取補償」或使用一鍵領取。每份本機資料可領取一次，期限至 2026 年 11 月 9 日 23:59（台灣時間）。\n\n祝你觀賽愉快，也歡迎透過「更多 → 意見與問題回報」分享心得。\n\nQuestNote 開發團隊',
  publishedAt:now, expiresAt:'2026-11-09T23:59:59+08:00', priority:'high',enabled:true,
  minAppVersion:'3.9.5',maxAppVersion:null,icon:'🎁',reward:{stardust:2000},
  action:{type:'view',view:'tasks',label:'前往任務頁星辰賭場'}
};
const check = validateMailboxDocument({schemaVersion:1,messages:[message]},catalogs);
if (!check.ok || check.warnings.length) throw new Error(JSON.stringify(check));
const merged = mergeMailboxes(scan.source,scan.production,catalogs);
if (merged.messages.some(m=>m.id===message.id)) throw new Error('Gift ID already exists');
const document = validateDocument({...merged,generatedAt:now,messages:[...merged.messages,message]},catalogs);
const eventId = '20261010-user-casino-gift-2000';
const decision = {eventId,action:'publish',reason:'使用者明確要求另追加賭金贈與信件，指定 2,000 星塵。這是獨立人工授權贈禮，並非重跑版本決策或失敗補償；不再次覆蓋已處理部署，不修改先前更新公告。',authorization:'追加賭金贈與信件 送2000星塵',deployments:[],messages:[message],documentHash:hash(encode(document)),document,release:scan.release,mainBase:scan.mainCommit,pagesBase:scan.pagesCommit,status:'prepared'};
fs.writeFileSync(directory+'/decision-'+eventId+'.json',encode(decision),{encoding:'utf8',flag:'wx'});
console.log(JSON.stringify({eventId,messageId:message.id,reward:message.reward,expiry:message.expiresAt,validation:'passed',existingMessagesPreserved:merged.messages.length}));