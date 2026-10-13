import evidence from './public-evidence.json';

type Topic = 'fish' | 'ink' | 'both' | 'general';
type Intent =
  | 'retention'
  | 'support'
  | 'impact'
  | 'craft'
  | 'beginner'
  | 'data'
  | 'interview'
  | 'daily'
  | 'digital'
  | 'visit'
  | 'people'
  | 'greeting'
  | 'thanks'
  | 'fallback';
export type ReplyContext = { topic: Topic; intents: Intent[] };
export type LocalReply = {
  text: string;
  topic: Topic;
  intents: Intent[];
  sourceIds: string[];
  followups: string[];
  context: ReplyContext;
};

const patterns: { intent: Intent; pattern: RegExp }[] = [
  {
    intent: 'retention',
    pattern:
      /留存|留下|留下来|后来|还在学|还会|持续学|继续学|继续做|坚持|失访|转化率|半年|一年后|几个月|过一季|体验结束|学徒比例/,
  },
  {
    intent: 'support',
    pattern:
      /支持|报酬|收入|挣钱|赚钱|养活|工资|生计|生活条件|五险|教人|教学|师傅|带徒|补贴|职业|工作/,
  },
  {
    intent: 'impact',
    pattern: /爆红|流量|热度|传播|短视频|播放|转化|是不是.*传承|说明.*传承|火了|走红|带来|证明/,
  },
  {
    intent: 'craft',
    pattern:
      /工序|步骤|怎么做|怎样做|制作方法|材料|竹|糊纸|绘鳞|描金|晾|多久|多长时间|时间.*长|干燥|快进|四关|四阶段/,
  },
  {
    intent: 'beginner',
    pattern: /想学|怎么学|怎样学|从哪里开始|从哪开始|零基础|入门|学会|拜师|学艺|找老师|找师傅/,
  },
  {
    intent: 'data',
    pattern:
      /数据|多少|几人|人数|人次|亿|万|百分|占比|比例|利润|订单|接待|营收|学校|工坊数量|统计|分母|八成|五成/,
  },
  {
    intent: 'interview',
    pattern: /采访|提纲|问什么|问哪些|该问|怎么问|怎样问|记录|核实|核对|证据|来源|查证|调查|回访/,
  },
  {
    intent: 'daily',
    pattern: /日常|生活里|留下手艺|平时|节后|学校|孩子|年轻|青少年|年轻人|长期|传下去/,
  },
  { intent: 'digital', pattern: /游戏|网站|网页|屏幕|三维|3d|数字|互动|模拟|线上/ },
  {
    intent: 'visit',
    pattern: /在哪|哪里玩|去哪|地址|门票|票价|开放|预约|旅游|想去|怎么去|路线|联系方式/,
  },
];
const choose = (question: string, choices: string[]) => {
  let hash = 0;
  for (const letter of question) hash = (hash * 31 + letter.codePointAt(0)!) >>> 0;
  return choices[hash % choices.length];
};

export function composeLocalReply(input: string, previous?: ReplyContext): LocalReply {
  const question = input.trim();
  if (!question) throw new Error('先写下一个想追问的问题。');
  if (question.length > 1200) throw new Error('问题请控制在 1200 字以内。');
  const normalized = question.replace(/\s+/g, '').toLowerCase();
  const fish = /鱼灯|汪满田|瞻淇|潘敏|汪华武|灯会/.test(normalized);
  const ink = /徽墨|制墨|墨厂|胡开文|申易鑫|程国胜/.test(normalized);
  const continues =
    /^(那|那么|还有|然后|所以|这个|他们|她|他|它|要是|如果|能不能|具体|为啥|为什么|多久|怎么核对)/.test(
      normalized,
    ) || /^.{0,6}(呢|吗|呀|啊)[？?]?$/.test(normalized);
  const topic: Topic =
    fish && ink
      ? 'both'
      : fish
        ? 'fish'
        : ink
          ? 'ink'
          : continues && previous
            ? previous.topic
            : 'general';
  const subject =
    topic === 'ink'
      ? '徽墨'
      : topic === 'fish'
        ? '鱼灯'
        : topic === 'both'
          ? '鱼灯与徽墨'
          : '这门手艺';
  let intents: Intent[] = patterns
    .filter((row) => row.pattern.test(normalized))
    .map((row) => row.intent);
  const person = evidence.people.find((row) => normalized.includes(row.name));
  const unknownPerson =
    !person && /[\u4e00-\u9fa5]{2,4}(什么时候成为|是哪里的传承人|是不是传承人)/.test(normalized);
  if (person || unknownPerson) intents.unshift('people');
  if (!intents.length && /^(你好|您好|嗨|hello|hi)[!！。,.，？?]*$/.test(normalized))
    intents = ['greeting'];
  if (!intents.length && /^(谢谢|感谢|明白了|知道了|好的|好|不问了)/.test(normalized))
    intents = ['thanks'];
  if (!intents.length && continues && previous && !fish && !ink)
    intents = [
      ...previous.intents
        .filter((x) => !['greeting', 'thanks', 'fallback'].includes(x))
        .slice(0, 2),
    ];
  if (!intents.length && (fish || ink || /非遗|传承|手艺/.test(normalized)))
    intents = ['impact', 'interview'];
  if (!intents.length) intents = ['fallback'];
  intents = [...new Set(intents)];
  const newFacts =
    /研培|研修/.test(normalized) && /多少|规模|院校|数量|人次/.test(normalized)
      ? ['training-colleges', 'training-classes', 'training-person-times']
      : topic === 'ink' &&
          /直播|电商/.test(normalized) &&
          /营收|收入/.test(normalized) &&
          !/利润|成本/.test(normalized)
        ? ['ink-online-revenue']
        : topic === 'ink' &&
            /合作|机构|平台/.test(normalized) &&
            /多少|数量|规模|几家/.test(normalized)
          ? ['ink-partners']
          : [];
  if (newFacts.length) intents = ['data'];
  const sourceIds: string[] = [];
  const cite = (id: string) => {
    if (!sourceIds.includes(id)) sourceIds.push(id);
  };
  const fact = (id: string) => {
    const row = evidence.measures.find((value) => value.id === id)!;
    cite(row.sourceId);
    return `${row.scope}，在${row.period}记录的是${row.valueText}${row.unit}。${row.limitation}`;
  };
  const paragraphs: string[] = [];
  const detailedData = /多少|19万|接待|利润|订单|八成|五成|80%|50%|1400|61|24家|学校/.test(
    normalized,
  );
  if (intents[0] === 'greeting')
    paragraphs.push(
      '你好。你可以直接问鱼灯、徽墨，也可以把一个还没想清楚的疑问写下来。我会结合这篇作品的资料，帮你把问题整理成下一次回访能核对的事。',
    );
  else if (intents[0] === 'thanks')
    paragraphs.push(
      '不客气。带着一个具体问题回到现场，就已经有了新的起点。如果你愿意，还可以接着问该记录什么、隔多久再联系，或者把问题卡下载带走。',
    );
  else if (intents[0] === 'fallback')
    paragraphs.push(
      choose(question, [
        '这个问题超出了这份作品收录的资料，我没法给你一个可靠答案。我们可以从鱼灯或徽墨继续聊：你更想了解制作、资料里的数字，还是体验者后来有没有继续学习？',
        '这份回访助手主要围绕鱼灯、徽墨和持续学习展开。你刚才的问题暂时没有对应资料；如果愿意，可以换成“怎样学”“怎样核实”或“下一次应该问什么”，我会帮你把它具体化。',
      ]),
    );
  else {
    if (intents[0] === 'people') {
      if (person) {
        const detail = person.milestones[0];
        cite(detail.sourceId);
        paragraphs.push(
          `${person.name}的公开路径是${person.craft}，${person.place}。${person.intro} ${detail.text} ${person.limit}`,
        );
      } else
        paragraphs.push(
          '这份作品没有收录你提到的这个人的可核对路径，我无法确认其身份或认定时间。可以先核对名录、具体技艺和认定批次，再沿原始报道寻找学艺记录；同名也不能直接当作同一个人。',
        );
    } else
      paragraphs.push(
        choose(question, [
          intents.includes('retention')
            ? `你问到的，是${subject}从“体验过”到“继续学”的那段路。这里最需要补上的，是同一个人的后来。`
            : `可以把你的问题落到${subject}的具体记录上。先弄清已有资料能说明什么，再决定下一次追问什么。`,
          intents.includes('support')
            ? `这个问题很实际：${subject}能不能持续教、持续做，最终要回到人的时间和生活条件。`
            : `你的疑问可以分成两步：先看${subject}已经留下的记录，再把还不知道的部分带到现场。`,
          intents.includes('craft')
            ? `如果你关心${subject}的制作，最好把“体验一个动作”和“能独立做完”分开来看。`
            : `我们可以从${subject}的现场开始，把这个疑问变成几件能够核对的小事。`,
        ]),
      );
    // Specific fact questions are answered before broad advice, regardless of keyword order.
    if (newFacts.length) {
      paragraphs.push(...newFacts.map(fact));
    } else if (detailedData && intents.includes('data')) {
      if (
        /多少钱|价格|票价|收费|销量|销售额|营业额/.test(normalized) ||
        (topic === 'ink' && /订单|学校/.test(normalized))
      )
        paragraphs.push(
          '作品资料没有提供这个对象、这个指标的可核对数字，不能拿其他工坊的订单或接待人次代替。可以向对应场所确认统计时间、对象和原始记录，再判断这个数字能说明什么。',
        );
      else if (/订单|利润|营收/.test(normalized))
        paragraphs.push(
          fact(/200|几只|多少只|预订/.test(normalized) ? 'fish-orders-count' : 'fish-orders-value'),
        );
      else if (/八成|80%|青少年/.test(normalized) && topic === 'ink')
        paragraphs.push(fact('ink-youth'));
      else if (/五成|50%|35岁/.test(normalized)) paragraphs.push(fact('fish-young-workers'));
      else if (/61|人才/.test(normalized)) paragraphs.push(fact('fish-talents'));
      else if (/24|工坊/.test(normalized) && topic !== 'ink')
        paragraphs.push(fact('fish-workshops'));
      else if (/学校/.test(normalized)) paragraphs.push(fact('fish-schools'));
      else if (/17\.1|播放|亿/.test(normalized)) paragraphs.push(fact('keyword-views'));
      else if (
        topic === 'ink' &&
        (!intents.includes('retention') || /19|接待|到访|墨厂/.test(normalized))
      )
        paragraphs.push(fact('ink-visits'));
      else if (/从业|1400/.test(normalized)) paragraphs.push(fact('fish-related-workers'));
      else if (!intents.includes('retention'))
        paragraphs.push(
          '要看你问的是播放次数、到访人次、制作人数还是学徒人数。这几种数字的对象和时间窗不同，不能互相代替；你可以补充想核对的具体指标。',
        );
    }
    for (const intent of intents.filter((x) => x !== 'people' && x !== 'data').slice(0, 3)) {
      if (intent === 'retention')
        paragraphs.push(
          choose(question, [
            '目前持续学习比例仍未知。公开资料没有连接同一批体验者的首次体验和后来学习。下一次可以在本人同意下，用匿名编号记录起点，隔一季问最近一次制作或上课的日期，再在半年或一年后核对。失访人数要单列，不能把没联系上当作没继续。',
            '持续学习比例仍未知：这篇作品还没有同一批体验者的跨期追踪，因此不能给出一个留存率。比“你还喜欢吗”更有用的是问：“最近一次动手是什么时候？有没有再次上课？能拿出什么记录？”先用匿名编号连接起点与回访，再报告参加人数、联系到的人数和失访人数。',
          ]),
        );
      if (intent === 'support') {
        if (topic === 'ink') {
          cite('pub-work-2026');
          paragraphs.push(
            '老胡开文墨厂的报道记录了工资和五险，但这是负责人自述，不是平均收入或留存率。回访师傅时，可以分开问授课报酬、备课与带徒时间、稳定场地，以及学徒能否负担继续学习；有合同、课表或工资记录时，再核对具体条件。',
          );
        } else {
          cite('pub-fish-2025');
          paragraphs.push(
            '可以问师傅三个具体问题：“非节庆时还有多少制作与授课安排？”“带一个新人要花多少时间，谁承担报酬和材料？”“有没有稳定场所和下一期课程？”鱼灯报道提及带徒补贴，实际覆盖谁、何时发放、能否持续，还需要现场核对。',
          );
        }
      }
      if (intent === 'impact') {
        cite(topic === 'ink' ? 'pub-ink-2026' : 'pub-douyin-2025');
        paragraphs.push(
          '传播能说明手艺被看见，到访能说明有人走进现场，实名制作与教学能说明具体的人在实践。它们各自有价值，但对象与时间窗不同，不能相除成“游客转学徒”的比例，也不能直接证明传播导致传承。要追问因果，仍需要同一批人的学习起点与后续记录。',
        );
      }
      if (intent === 'craft') {
        if (topic === 'ink')
          paragraphs.push(
            `${fact('ink-drying')} 这不是学成所需的时间。页面把动作合成四个体验阶段；真实制墨还需要辨别材料、练习动作与等待，不能因为完成屏幕工坊就判断已经掌握。`,
          );
        else if (topic === 'fish')
          paragraphs.push(
            '页面可以先体验扎骨、糊纸、绘鳞和点灯四个阶段。现场要进一步看骨架怎样连接、纸面怎样贴合、灯体如何平衡，并在师傅指导下处理工具和灯具。四阶段是工艺意象，不是完整教程；这份资料也没有给出统一的学成天数。',
          );
        else
          paragraphs.push(
            '鱼灯的页面体验是扎骨、糊纸、绘鳞、点灯；徽墨则合并了制墨动作和等待。两者都只是四阶段工艺意象，不代表完成培训。你更想问哪一门的材料、步骤，还是现实中需要多久？',
          );
      }
      if (intent === 'beginner')
        paragraphs.push(
          `如果想开始学${subject}，可以先找能反复授课的场所，问清下一次课程、费用、材料与师傅是否能看你的练习。第一次体验后留下一个具体目标，例如“下次自己完成一处骨架连接”或“在指导下辨别一道制墨工序”。是否学会，要看能否独立完成并解释步骤，不以喜欢或一次打卡判断。`,
        );
      if (intent === 'interview')
        paragraphs.push(
          choose(question, [
            '带到现场的追问可以是：“上一次是什么时候、具体做了什么？”“之后有没有再次学习或制作？”“谁可以帮忙核对，有没有课表、作品或日期记录？”分别标清自述与已核对的证据，先征得同意，不在公开问题卡里放联系方式。',
            '下一次可以先问最近一次制作或授课，再问中间停过多久、为什么停，最后请对方指出能核对的作品、课程或日期。这样能区分意愿、实际行动和证据；记得注明哪些只是本人自述。',
          ]),
        );
      if (intent === 'daily')
        paragraphs.push(
          '让手艺留在日常，可以从固定课程、重复练习、稳定场所和可持续报酬这些条件追问。年轻人接触过、参加过活动，只能说明有入口；是否继续，要核对下一次行动，而不是把年龄结构当作新增学徒。',
        );
      if (intent === 'digital')
        paragraphs.push(
          '屏幕互动可以让读者感受动作和等待，也能成为下一次现场学习的入口。它留下的是一次阅读与体验，不能自动变成真实学艺记录。完成游戏后，可以带着最想学的一道工序去问师傅，再记录实际练习和得到的反馈。',
        );
      if (intent === 'visit')
        paragraphs.push(
          '作品里的地点包括歙县汪满田、瞻淇和老胡开文墨厂，以及黟县相关教学场景；它们对应不同的人与项目。资料没有实时门票、开放时间和预约信息，出发前需通过场所官方渠道核实。我可以先帮你整理去现场要问的问题。',
        );
    }
    if (intents.length === 1 && intents[0] === 'data' && !detailedData)
      paragraphs.push(
        '你可以说明想查哪个数字。资料里的播放次数、接待人次、县域从业人数和个人订单，都保留各自的时间与范围；其中持续学习比例仍未知。',
      );
  }
  const followups =
    topic === 'ink'
      ? ['那要多久呢？', '墨厂接待人数能说明学会了吗？', '怎样核对师傅持续教学的条件？']
      : topic === 'fish'
        ? [
            '鱼灯体验后，怎么核对是否继续学？',
            '订单能说明传承更好了吗？',
            '第一次学鱼灯从哪里开始？',
          ]
        : [
            '半年后，怎么知道有人还在学？',
            '我想学徽墨，从哪里开始？',
            '鱼灯师傅持续教学需要什么支持？',
          ];
  return {
    text: paragraphs.join('\n\n'),
    topic,
    intents,
    sourceIds,
    followups,
    context: { topic, intents },
  };
}
