var be=Object.defineProperty;var Ae=(u,e,n)=>e in u?be(u,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):u[e]=n;var g=(u,e,n)=>Ae(u,typeof e!="symbol"?e+"":e,n);import{r as U,j as b,l as Y,m as V,E as ee}from"./index-D7CUdP2S.js";import{P as Pe,S as we,T as xe,R as Se}from"./CrmApp-gpu0Y81V.js";import"./PenNib-DcfwcWlr.js";import"./Buildings-Cc8mk4mN.js";import"./WarningCircle-wQ1oLzYI.js";function z(){return{async:!1,breaks:!1,extensions:null,gfm:!0,hooks:null,pedantic:!1,renderer:null,silent:!1,tokenizer:null,walkTokens:null}}let q=z();function oe(u){q=u}const le=/[&<>"']/,ke=new RegExp(le.source,"g"),ue=/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,qe=new RegExp(ue.source,"g"),ye={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},ne=u=>ye[u];function A(u,e){if(e){if(le.test(u))return u.replace(ke,ne)}else if(ue.test(u))return u.replace(qe,ne);return u}const Ne=/(^|[^\[])\^/g;function m(u,e){let n=typeof u=="string"?u:u.source;e=e||"";const t={replace:(r,i)=>{let s=typeof i=="string"?i:i.source;return s=s.replace(Ne,"$1"),n=n.replace(r,s),t},getRegex:()=>new RegExp(n,e)};return t}function te(u){try{u=encodeURI(u).replace(/%25/g,"%")}catch{return null}return u}const L={exec:()=>null};function re(u,e){const n=u.replace(/\|/g,(i,s,a)=>{let o=!1,c=s;for(;--c>=0&&a[c]==="\\";)o=!o;return o?"|":" |"}),t=n.split(/ \|/);let r=0;if(t[0].trim()||t.shift(),t.length>0&&!t[t.length-1].trim()&&t.pop(),e)if(t.length>e)t.splice(e);else for(;t.length<e;)t.push("");for(;r<t.length;r++)t[r]=t[r].trim().replace(/\\\|/g,"|");return t}function N(u,e,n){const t=u.length;if(t===0)return"";let r=0;for(;r<t&&u.charAt(t-r-1)===e;)r++;return u.slice(0,t-r)}function Ce(u,e){if(u.indexOf(e[1])===-1)return-1;let n=0;for(let t=0;t<u.length;t++)if(u[t]==="\\")t++;else if(u[t]===e[0])n++;else if(u[t]===e[1]&&(n--,n<0))return t;return-1}function ie(u,e,n,t){const r=e.href,i=e.title?A(e.title):null,s=u[1].replace(/\\([\[\]])/g,"$1");if(u[0].charAt(0)!=="!"){t.state.inLink=!0;const a={type:"link",raw:n,href:r,title:i,text:s,tokens:t.inlineTokens(s)};return t.state.inLink=!1,a}return{type:"image",raw:n,href:r,title:i,text:A(s)}}function Le(u,e){const n=u.match(/^(\s+)(?:```)/);if(n===null)return e;const t=n[1];return e.split(`
`).map(r=>{const i=r.match(/^\s+/);if(i===null)return r;const[s]=i;return s.length>=t.length?r.slice(t.length):r}).join(`
`)}class X{constructor(e){g(this,"options");g(this,"rules");g(this,"lexer");this.options=e||q}space(e){const n=this.rules.block.newline.exec(e);if(n&&n[0].length>0)return{type:"space",raw:n[0]}}code(e){const n=this.rules.block.code.exec(e);if(n){const t=n[0].replace(/^(?: {1,4}| {0,3}\t)/gm,"");return{type:"code",raw:n[0],codeBlockStyle:"indented",text:this.options.pedantic?t:N(t,`
`)}}}fences(e){const n=this.rules.block.fences.exec(e);if(n){const t=n[0],r=Le(t,n[3]||"");return{type:"code",raw:t,lang:n[2]?n[2].trim().replace(this.rules.inline.anyPunctuation,"$1"):n[2],text:r}}}heading(e){const n=this.rules.block.heading.exec(e);if(n){let t=n[2].trim();if(/#$/.test(t)){const r=N(t,"#");(this.options.pedantic||!r||/ $/.test(r))&&(t=r.trim())}return{type:"heading",raw:n[0],depth:n[1].length,text:t,tokens:this.lexer.inline(t)}}}hr(e){const n=this.rules.block.hr.exec(e);if(n)return{type:"hr",raw:N(n[0],`
`)}}blockquote(e){const n=this.rules.block.blockquote.exec(e);if(n){let t=N(n[0],`
`).split(`
`),r="",i="";const s=[];for(;t.length>0;){let a=!1;const o=[];let c;for(c=0;c<t.length;c++)if(/^ {0,3}>/.test(t[c]))o.push(t[c]),a=!0;else if(!a)o.push(t[c]);else break;t=t.slice(c);const l=o.join(`
`),p=l.replace(/\n {0,3}((?:=+|-+) *)(?=\n|$)/g,`
    $1`).replace(/^ {0,3}>[ \t]?/gm,"");r=r?`${r}
${l}`:l,i=i?`${i}
${p}`:p;const h=this.lexer.state.top;if(this.lexer.state.top=!0,this.lexer.blockTokens(p,s,!0),this.lexer.state.top=h,t.length===0)break;const v=s[s.length-1];if((v==null?void 0:v.type)==="code")break;if((v==null?void 0:v.type)==="blockquote"){const f=v,P=f.raw+`
`+t.join(`
`),S=this.blockquote(P);s[s.length-1]=S,r=r.substring(0,r.length-f.raw.length)+S.raw,i=i.substring(0,i.length-f.text.length)+S.text;break}else if((v==null?void 0:v.type)==="list"){const f=v,P=f.raw+`
`+t.join(`
`),S=this.list(P);s[s.length-1]=S,r=r.substring(0,r.length-v.raw.length)+S.raw,i=i.substring(0,i.length-f.raw.length)+S.raw,t=P.substring(s[s.length-1].raw.length).split(`
`);continue}}return{type:"blockquote",raw:r,tokens:s,text:i}}}list(e){let n=this.rules.block.list.exec(e);if(n){let t=n[1].trim();const r=t.length>1,i={type:"list",raw:"",ordered:r,start:r?+t.slice(0,-1):"",loose:!1,items:[]};t=r?`\\d{1,9}\\${t.slice(-1)}`:`\\${t}`,this.options.pedantic&&(t=r?t:"[*+-]");const s=new RegExp(`^( {0,3}${t})((?:[	 ][^\\n]*)?(?:\\n|$))`);let a=!1;for(;e;){let o=!1,c="",l="";if(!(n=s.exec(e))||this.rules.block.hr.test(e))break;c=n[0],e=e.substring(c.length);let p=n[2].split(`
`,1)[0].replace(/^\t+/,F=>" ".repeat(3*F.length)),h=e.split(`
`,1)[0],v=!p.trim(),f=0;if(this.options.pedantic?(f=2,l=p.trimStart()):v?f=n[1].length+1:(f=n[2].search(/[^ ]/),f=f>4?1:f,l=p.slice(f),f+=n[1].length),v&&/^[ \t]*$/.test(h)&&(c+=h+`
`,e=e.substring(h.length+1),o=!0),!o){const F=new RegExp(`^ {0,${Math.min(3,f-1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),Q=new RegExp(`^ {0,${Math.min(3,f-1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),J=new RegExp(`^ {0,${Math.min(3,f-1)}}(?:\`\`\`|~~~)`),Z=new RegExp(`^ {0,${Math.min(3,f-1)}}#`),ve=new RegExp(`^ {0,${Math.min(3,f-1)}}<(?:[a-z].*>|!--)`,"i");for(;e;){const B=e.split(`
`,1)[0];let y;if(h=B,this.options.pedantic?(h=h.replace(/^ {1,4}(?=( {4})*[^ ])/g,"  "),y=h):y=h.replace(/\t/g,"    "),J.test(h)||Z.test(h)||ve.test(h)||F.test(h)||Q.test(h))break;if(y.search(/[^ ]/)>=f||!h.trim())l+=`
`+y.slice(f);else{if(v||p.replace(/\t/g,"    ").search(/[^ ]/)>=4||J.test(p)||Z.test(p)||Q.test(p))break;l+=`
`+h}!v&&!h.trim()&&(v=!0),c+=B+`
`,e=e.substring(B.length+1),p=y.slice(f)}}i.loose||(a?i.loose=!0:/\n[ \t]*\n[ \t]*$/.test(c)&&(a=!0));let P=null,S;this.options.gfm&&(P=/^\[[ xX]\] /.exec(l),P&&(S=P[0]!=="[ ] ",l=l.replace(/^\[[ xX]\] +/,""))),i.items.push({type:"list_item",raw:c,task:!!P,checked:S,loose:!1,text:l,tokens:[]}),i.raw+=c}i.items[i.items.length-1].raw=i.items[i.items.length-1].raw.trimEnd(),i.items[i.items.length-1].text=i.items[i.items.length-1].text.trimEnd(),i.raw=i.raw.trimEnd();for(let o=0;o<i.items.length;o++)if(this.lexer.state.top=!1,i.items[o].tokens=this.lexer.blockTokens(i.items[o].text,[]),!i.loose){const c=i.items[o].tokens.filter(p=>p.type==="space"),l=c.length>0&&c.some(p=>/\n.*\n/.test(p.raw));i.loose=l}if(i.loose)for(let o=0;o<i.items.length;o++)i.items[o].loose=!0;return i}}html(e){const n=this.rules.block.html.exec(e);if(n)return{type:"html",block:!0,raw:n[0],pre:n[1]==="pre"||n[1]==="script"||n[1]==="style",text:n[0]}}def(e){const n=this.rules.block.def.exec(e);if(n){const t=n[1].toLowerCase().replace(/\s+/g," "),r=n[2]?n[2].replace(/^<(.*)>$/,"$1").replace(this.rules.inline.anyPunctuation,"$1"):"",i=n[3]?n[3].substring(1,n[3].length-1).replace(this.rules.inline.anyPunctuation,"$1"):n[3];return{type:"def",tag:t,raw:n[0],href:r,title:i}}}table(e){const n=this.rules.block.table.exec(e);if(!n||!/[:|]/.test(n[2]))return;const t=re(n[1]),r=n[2].replace(/^\||\| *$/g,"").split("|"),i=n[3]&&n[3].trim()?n[3].replace(/\n[ \t]*$/,"").split(`
`):[],s={type:"table",raw:n[0],header:[],align:[],rows:[]};if(t.length===r.length){for(const a of r)/^ *-+: *$/.test(a)?s.align.push("right"):/^ *:-+: *$/.test(a)?s.align.push("center"):/^ *:-+ *$/.test(a)?s.align.push("left"):s.align.push(null);for(let a=0;a<t.length;a++)s.header.push({text:t[a],tokens:this.lexer.inline(t[a]),header:!0,align:s.align[a]});for(const a of i)s.rows.push(re(a,s.header.length).map((o,c)=>({text:o,tokens:this.lexer.inline(o),header:!1,align:s.align[c]})));return s}}lheading(e){const n=this.rules.block.lheading.exec(e);if(n)return{type:"heading",raw:n[0],depth:n[2].charAt(0)==="="?1:2,text:n[1],tokens:this.lexer.inline(n[1])}}paragraph(e){const n=this.rules.block.paragraph.exec(e);if(n){const t=n[1].charAt(n[1].length-1)===`
`?n[1].slice(0,-1):n[1];return{type:"paragraph",raw:n[0],text:t,tokens:this.lexer.inline(t)}}}text(e){const n=this.rules.block.text.exec(e);if(n)return{type:"text",raw:n[0],text:n[0],tokens:this.lexer.inline(n[0])}}escape(e){const n=this.rules.inline.escape.exec(e);if(n)return{type:"escape",raw:n[0],text:A(n[1])}}tag(e){const n=this.rules.inline.tag.exec(e);if(n)return!this.lexer.state.inLink&&/^<a /i.test(n[0])?this.lexer.state.inLink=!0:this.lexer.state.inLink&&/^<\/a>/i.test(n[0])&&(this.lexer.state.inLink=!1),!this.lexer.state.inRawBlock&&/^<(pre|code|kbd|script)(\s|>)/i.test(n[0])?this.lexer.state.inRawBlock=!0:this.lexer.state.inRawBlock&&/^<\/(pre|code|kbd|script)(\s|>)/i.test(n[0])&&(this.lexer.state.inRawBlock=!1),{type:"html",raw:n[0],inLink:this.lexer.state.inLink,inRawBlock:this.lexer.state.inRawBlock,block:!1,text:n[0]}}link(e){const n=this.rules.inline.link.exec(e);if(n){const t=n[2].trim();if(!this.options.pedantic&&/^</.test(t)){if(!/>$/.test(t))return;const s=N(t.slice(0,-1),"\\");if((t.length-s.length)%2===0)return}else{const s=Ce(n[2],"()");if(s>-1){const o=(n[0].indexOf("!")===0?5:4)+n[1].length+s;n[2]=n[2].substring(0,s),n[0]=n[0].substring(0,o).trim(),n[3]=""}}let r=n[2],i="";if(this.options.pedantic){const s=/^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(r);s&&(r=s[1],i=s[3])}else i=n[3]?n[3].slice(1,-1):"";return r=r.trim(),/^</.test(r)&&(this.options.pedantic&&!/>$/.test(t)?r=r.slice(1):r=r.slice(1,-1)),ie(n,{href:r&&r.replace(this.rules.inline.anyPunctuation,"$1"),title:i&&i.replace(this.rules.inline.anyPunctuation,"$1")},n[0],this.lexer)}}reflink(e,n){let t;if((t=this.rules.inline.reflink.exec(e))||(t=this.rules.inline.nolink.exec(e))){const r=(t[2]||t[1]).replace(/\s+/g," "),i=n[r.toLowerCase()];if(!i){const s=t[0].charAt(0);return{type:"text",raw:s,text:s}}return ie(t,i,t[0],this.lexer)}}emStrong(e,n,t=""){let r=this.rules.inline.emStrongLDelim.exec(e);if(!r||r[3]&&t.match(/[\p{L}\p{N}]/u))return;if(!(r[1]||r[2]||"")||!t||this.rules.inline.punctuation.exec(t)){const s=[...r[0]].length-1;let a,o,c=s,l=0;const p=r[0][0]==="*"?this.rules.inline.emStrongRDelimAst:this.rules.inline.emStrongRDelimUnd;for(p.lastIndex=0,n=n.slice(-1*e.length+s);(r=p.exec(n))!=null;){if(a=r[1]||r[2]||r[3]||r[4]||r[5]||r[6],!a)continue;if(o=[...a].length,r[3]||r[4]){c+=o;continue}else if((r[5]||r[6])&&s%3&&!((s+o)%3)){l+=o;continue}if(c-=o,c>0)continue;o=Math.min(o,o+c+l);const h=[...r[0]][0].length,v=e.slice(0,s+r.index+h+o);if(Math.min(s,o)%2){const P=v.slice(1,-1);return{type:"em",raw:v,text:P,tokens:this.lexer.inlineTokens(P)}}const f=v.slice(2,-2);return{type:"strong",raw:v,text:f,tokens:this.lexer.inlineTokens(f)}}}}codespan(e){const n=this.rules.inline.code.exec(e);if(n){let t=n[2].replace(/\n/g," ");const r=/[^ ]/.test(t),i=/^ /.test(t)&&/ $/.test(t);return r&&i&&(t=t.substring(1,t.length-1)),t=A(t,!0),{type:"codespan",raw:n[0],text:t}}}br(e){const n=this.rules.inline.br.exec(e);if(n)return{type:"br",raw:n[0]}}del(e){const n=this.rules.inline.del.exec(e);if(n)return{type:"del",raw:n[0],text:n[2],tokens:this.lexer.inlineTokens(n[2])}}autolink(e){const n=this.rules.inline.autolink.exec(e);if(n){let t,r;return n[2]==="@"?(t=A(n[1]),r="mailto:"+t):(t=A(n[1]),r=t),{type:"link",raw:n[0],text:t,href:r,tokens:[{type:"text",raw:t,text:t}]}}}url(e){var t;let n;if(n=this.rules.inline.url.exec(e)){let r,i;if(n[2]==="@")r=A(n[0]),i="mailto:"+r;else{let s;do s=n[0],n[0]=((t=this.rules.inline._backpedal.exec(n[0]))==null?void 0:t[0])??"";while(s!==n[0]);r=A(n[0]),n[1]==="www."?i="http://"+n[0]:i=n[0]}return{type:"link",raw:n[0],text:r,href:i,tokens:[{type:"text",raw:r,text:r}]}}}inlineText(e){const n=this.rules.inline.text.exec(e);if(n){let t;return this.lexer.state.inRawBlock?t=n[0]:t=A(n[0]),{type:"text",raw:n[0],text:t}}}}const Ie=/^(?:[ \t]*(?:\n|$))+/,Te=/^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,Re=/^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,T=/^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,Me=/^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,ce=/(?:[*+-]|\d{1,9}[.)])/,pe=m(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g,ce).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).getRegex(),H=/^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,Xe=/^[^\n]+/,$=/(?!\s*\])(?:\\.|[^\[\]\\])+/,De=m(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label",$).replace("title",/(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(),je=m(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g,ce).getRegex(),E="address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul",O=/<!--(?:-?>|[\s\S]*?(?:-->|$))/,Ee=m("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))","i").replace("comment",O).replace("tag",E).replace("attribute",/ +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),de=m(H).replace("hr",T).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("|table","").replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",E).getRegex(),Fe=m(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph",de).getRegex(),W={blockquote:Fe,code:Te,def:De,fences:Re,heading:Me,hr:T,html:Ee,lheading:pe,list:je,newline:Ie,paragraph:de,table:L,text:Xe},se=m("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr",T).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("blockquote"," {0,3}>").replace("code","(?: {4}| {0,3}	)[^\\n]").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",E).getRegex(),Be={...W,table:se,paragraph:m(H).replace("hr",T).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("table",se).replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",E).getRegex()},Ue={...W,html:m(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment",O).replace(/tag/g,"(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,heading:/^(#{1,6})(.*)(?:\n+|$)/,fences:L,lheading:/^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,paragraph:m(H).replace("hr",T).replace("heading",` *#{1,6} *[^
]`).replace("lheading",pe).replace("|table","").replace("blockquote"," {0,3}>").replace("|fences","").replace("|list","").replace("|html","").replace("|tag","").getRegex()},me=/^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,Ve=/^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,he=/^( {2,}|\\)\n(?!\s*$)/,Ge=/^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,R="\\p{P}\\p{S}",ze=m(/^((?![*_])[\spunctuation])/,"u").replace(/punctuation/g,R).getRegex(),He=/\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g,$e=m(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/,"u").replace(/punct/g,R).getRegex(),Oe=m("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])","gu").replace(/punct/g,R).getRegex(),We=m("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])","gu").replace(/punct/g,R).getRegex(),_e=m(/\\([punct])/,"gu").replace(/punct/g,R).getRegex(),Ke=m(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme",/[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email",/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),Qe=m(O).replace("(?:-->|$)","-->").getRegex(),Je=m("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment",Qe).replace("attribute",/\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),D=/(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/,Ze=m(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label",D).replace("href",/<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title",/"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(),ge=m(/^!?\[(label)\]\[(ref)\]/).replace("label",D).replace("ref",$).getRegex(),fe=m(/^!?\[(ref)\](?:\[\])?/).replace("ref",$).getRegex(),Ye=m("reflink|nolink(?!\\()","g").replace("reflink",ge).replace("nolink",fe).getRegex(),_={_backpedal:L,anyPunctuation:_e,autolink:Ke,blockSkip:He,br:he,code:Ve,del:L,emStrongLDelim:$e,emStrongRDelimAst:Oe,emStrongRDelimUnd:We,escape:me,link:Ze,nolink:fe,punctuation:ze,reflink:ge,reflinkSearch:Ye,tag:Je,text:Ge,url:L},en={..._,link:m(/^!?\[(label)\]\((.*?)\)/).replace("label",D).getRegex(),reflink:m(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label",D).getRegex()},G={..._,escape:m(me).replace("])","~|])").getRegex(),url:m(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,"i").replace("email",/[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),_backpedal:/(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,del:/^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,text:/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/},nn={...G,br:m(he).replace("{2,}","*").getRegex(),text:m(G.text).replace("\\b_","\\b_| {2,}\\n").replace(/\{2,\}/g,"*").getRegex()},M={normal:W,gfm:Be,pedantic:Ue},C={normal:_,gfm:G,breaks:nn,pedantic:en};class w{constructor(e){g(this,"tokens");g(this,"options");g(this,"state");g(this,"tokenizer");g(this,"inlineQueue");this.tokens=[],this.tokens.links=Object.create(null),this.options=e||q,this.options.tokenizer=this.options.tokenizer||new X,this.tokenizer=this.options.tokenizer,this.tokenizer.options=this.options,this.tokenizer.lexer=this,this.inlineQueue=[],this.state={inLink:!1,inRawBlock:!1,top:!0};const n={block:M.normal,inline:C.normal};this.options.pedantic?(n.block=M.pedantic,n.inline=C.pedantic):this.options.gfm&&(n.block=M.gfm,this.options.breaks?n.inline=C.breaks:n.inline=C.gfm),this.tokenizer.rules=n}static get rules(){return{block:M,inline:C}}static lex(e,n){return new w(n).lex(e)}static lexInline(e,n){return new w(n).inlineTokens(e)}lex(e){e=e.replace(/\r\n|\r/g,`
`),this.blockTokens(e,this.tokens);for(let n=0;n<this.inlineQueue.length;n++){const t=this.inlineQueue[n];this.inlineTokens(t.src,t.tokens)}return this.inlineQueue=[],this.tokens}blockTokens(e,n=[],t=!1){this.options.pedantic&&(e=e.replace(/\t/g,"    ").replace(/^ +$/gm,""));let r,i,s;for(;e;)if(!(this.options.extensions&&this.options.extensions.block&&this.options.extensions.block.some(a=>(r=a.call({lexer:this},e,n))?(e=e.substring(r.raw.length),n.push(r),!0):!1))){if(r=this.tokenizer.space(e)){e=e.substring(r.raw.length),r.raw.length===1&&n.length>0?n[n.length-1].raw+=`
`:n.push(r);continue}if(r=this.tokenizer.code(e)){e=e.substring(r.raw.length),i=n[n.length-1],i&&(i.type==="paragraph"||i.type==="text")?(i.raw+=`
`+r.raw,i.text+=`
`+r.text,this.inlineQueue[this.inlineQueue.length-1].src=i.text):n.push(r);continue}if(r=this.tokenizer.fences(e)){e=e.substring(r.raw.length),n.push(r);continue}if(r=this.tokenizer.heading(e)){e=e.substring(r.raw.length),n.push(r);continue}if(r=this.tokenizer.hr(e)){e=e.substring(r.raw.length),n.push(r);continue}if(r=this.tokenizer.blockquote(e)){e=e.substring(r.raw.length),n.push(r);continue}if(r=this.tokenizer.list(e)){e=e.substring(r.raw.length),n.push(r);continue}if(r=this.tokenizer.html(e)){e=e.substring(r.raw.length),n.push(r);continue}if(r=this.tokenizer.def(e)){e=e.substring(r.raw.length),i=n[n.length-1],i&&(i.type==="paragraph"||i.type==="text")?(i.raw+=`
`+r.raw,i.text+=`
`+r.raw,this.inlineQueue[this.inlineQueue.length-1].src=i.text):this.tokens.links[r.tag]||(this.tokens.links[r.tag]={href:r.href,title:r.title});continue}if(r=this.tokenizer.table(e)){e=e.substring(r.raw.length),n.push(r);continue}if(r=this.tokenizer.lheading(e)){e=e.substring(r.raw.length),n.push(r);continue}if(s=e,this.options.extensions&&this.options.extensions.startBlock){let a=1/0;const o=e.slice(1);let c;this.options.extensions.startBlock.forEach(l=>{c=l.call({lexer:this},o),typeof c=="number"&&c>=0&&(a=Math.min(a,c))}),a<1/0&&a>=0&&(s=e.substring(0,a+1))}if(this.state.top&&(r=this.tokenizer.paragraph(s))){i=n[n.length-1],t&&(i==null?void 0:i.type)==="paragraph"?(i.raw+=`
`+r.raw,i.text+=`
`+r.text,this.inlineQueue.pop(),this.inlineQueue[this.inlineQueue.length-1].src=i.text):n.push(r),t=s.length!==e.length,e=e.substring(r.raw.length);continue}if(r=this.tokenizer.text(e)){e=e.substring(r.raw.length),i=n[n.length-1],i&&i.type==="text"?(i.raw+=`
`+r.raw,i.text+=`
`+r.text,this.inlineQueue.pop(),this.inlineQueue[this.inlineQueue.length-1].src=i.text):n.push(r);continue}if(e){const a="Infinite loop on byte: "+e.charCodeAt(0);if(this.options.silent){console.error(a);break}else throw new Error(a)}}return this.state.top=!0,n}inline(e,n=[]){return this.inlineQueue.push({src:e,tokens:n}),n}inlineTokens(e,n=[]){let t,r,i,s=e,a,o,c;if(this.tokens.links){const l=Object.keys(this.tokens.links);if(l.length>0)for(;(a=this.tokenizer.rules.inline.reflinkSearch.exec(s))!=null;)l.includes(a[0].slice(a[0].lastIndexOf("[")+1,-1))&&(s=s.slice(0,a.index)+"["+"a".repeat(a[0].length-2)+"]"+s.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex))}for(;(a=this.tokenizer.rules.inline.blockSkip.exec(s))!=null;)s=s.slice(0,a.index)+"["+"a".repeat(a[0].length-2)+"]"+s.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);for(;(a=this.tokenizer.rules.inline.anyPunctuation.exec(s))!=null;)s=s.slice(0,a.index)+"++"+s.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);for(;e;)if(o||(c=""),o=!1,!(this.options.extensions&&this.options.extensions.inline&&this.options.extensions.inline.some(l=>(t=l.call({lexer:this},e,n))?(e=e.substring(t.raw.length),n.push(t),!0):!1))){if(t=this.tokenizer.escape(e)){e=e.substring(t.raw.length),n.push(t);continue}if(t=this.tokenizer.tag(e)){e=e.substring(t.raw.length),r=n[n.length-1],r&&t.type==="text"&&r.type==="text"?(r.raw+=t.raw,r.text+=t.text):n.push(t);continue}if(t=this.tokenizer.link(e)){e=e.substring(t.raw.length),n.push(t);continue}if(t=this.tokenizer.reflink(e,this.tokens.links)){e=e.substring(t.raw.length),r=n[n.length-1],r&&t.type==="text"&&r.type==="text"?(r.raw+=t.raw,r.text+=t.text):n.push(t);continue}if(t=this.tokenizer.emStrong(e,s,c)){e=e.substring(t.raw.length),n.push(t);continue}if(t=this.tokenizer.codespan(e)){e=e.substring(t.raw.length),n.push(t);continue}if(t=this.tokenizer.br(e)){e=e.substring(t.raw.length),n.push(t);continue}if(t=this.tokenizer.del(e)){e=e.substring(t.raw.length),n.push(t);continue}if(t=this.tokenizer.autolink(e)){e=e.substring(t.raw.length),n.push(t);continue}if(!this.state.inLink&&(t=this.tokenizer.url(e))){e=e.substring(t.raw.length),n.push(t);continue}if(i=e,this.options.extensions&&this.options.extensions.startInline){let l=1/0;const p=e.slice(1);let h;this.options.extensions.startInline.forEach(v=>{h=v.call({lexer:this},p),typeof h=="number"&&h>=0&&(l=Math.min(l,h))}),l<1/0&&l>=0&&(i=e.substring(0,l+1))}if(t=this.tokenizer.inlineText(i)){e=e.substring(t.raw.length),t.raw.slice(-1)!=="_"&&(c=t.raw.slice(-1)),o=!0,r=n[n.length-1],r&&r.type==="text"?(r.raw+=t.raw,r.text+=t.text):n.push(t);continue}if(e){const l="Infinite loop on byte: "+e.charCodeAt(0);if(this.options.silent){console.error(l);break}else throw new Error(l)}}return n}}class j{constructor(e){g(this,"options");g(this,"parser");this.options=e||q}space(e){return""}code({text:e,lang:n,escaped:t}){var s;const r=(s=(n||"").match(/^\S*/))==null?void 0:s[0],i=e.replace(/\n$/,"")+`
`;return r?'<pre><code class="language-'+A(r)+'">'+(t?i:A(i,!0))+`</code></pre>
`:"<pre><code>"+(t?i:A(i,!0))+`</code></pre>
`}blockquote({tokens:e}){return`<blockquote>
${this.parser.parse(e)}</blockquote>
`}html({text:e}){return e}heading({tokens:e,depth:n}){return`<h${n}>${this.parser.parseInline(e)}</h${n}>
`}hr(e){return`<hr>
`}list(e){const n=e.ordered,t=e.start;let r="";for(let a=0;a<e.items.length;a++){const o=e.items[a];r+=this.listitem(o)}const i=n?"ol":"ul",s=n&&t!==1?' start="'+t+'"':"";return"<"+i+s+`>
`+r+"</"+i+`>
`}listitem(e){let n="";if(e.task){const t=this.checkbox({checked:!!e.checked});e.loose?e.tokens.length>0&&e.tokens[0].type==="paragraph"?(e.tokens[0].text=t+" "+e.tokens[0].text,e.tokens[0].tokens&&e.tokens[0].tokens.length>0&&e.tokens[0].tokens[0].type==="text"&&(e.tokens[0].tokens[0].text=t+" "+e.tokens[0].tokens[0].text)):e.tokens.unshift({type:"text",raw:t+" ",text:t+" "}):n+=t+" "}return n+=this.parser.parse(e.tokens,!!e.loose),`<li>${n}</li>
`}checkbox({checked:e}){return"<input "+(e?'checked="" ':"")+'disabled="" type="checkbox">'}paragraph({tokens:e}){return`<p>${this.parser.parseInline(e)}</p>
`}table(e){let n="",t="";for(let i=0;i<e.header.length;i++)t+=this.tablecell(e.header[i]);n+=this.tablerow({text:t});let r="";for(let i=0;i<e.rows.length;i++){const s=e.rows[i];t="";for(let a=0;a<s.length;a++)t+=this.tablecell(s[a]);r+=this.tablerow({text:t})}return r&&(r=`<tbody>${r}</tbody>`),`<table>
<thead>
`+n+`</thead>
`+r+`</table>
`}tablerow({text:e}){return`<tr>
${e}</tr>
`}tablecell(e){const n=this.parser.parseInline(e.tokens),t=e.header?"th":"td";return(e.align?`<${t} align="${e.align}">`:`<${t}>`)+n+`</${t}>
`}strong({tokens:e}){return`<strong>${this.parser.parseInline(e)}</strong>`}em({tokens:e}){return`<em>${this.parser.parseInline(e)}</em>`}codespan({text:e}){return`<code>${e}</code>`}br(e){return"<br>"}del({tokens:e}){return`<del>${this.parser.parseInline(e)}</del>`}link({href:e,title:n,tokens:t}){const r=this.parser.parseInline(t),i=te(e);if(i===null)return r;e=i;let s='<a href="'+e+'"';return n&&(s+=' title="'+n+'"'),s+=">"+r+"</a>",s}image({href:e,title:n,text:t}){const r=te(e);if(r===null)return t;e=r;let i=`<img src="${e}" alt="${t}"`;return n&&(i+=` title="${n}"`),i+=">",i}text(e){return"tokens"in e&&e.tokens?this.parser.parseInline(e.tokens):e.text}}class K{strong({text:e}){return e}em({text:e}){return e}codespan({text:e}){return e}del({text:e}){return e}html({text:e}){return e}text({text:e}){return e}link({text:e}){return""+e}image({text:e}){return""+e}br(){return""}}class x{constructor(e){g(this,"options");g(this,"renderer");g(this,"textRenderer");this.options=e||q,this.options.renderer=this.options.renderer||new j,this.renderer=this.options.renderer,this.renderer.options=this.options,this.renderer.parser=this,this.textRenderer=new K}static parse(e,n){return new x(n).parse(e)}static parseInline(e,n){return new x(n).parseInline(e)}parse(e,n=!0){let t="";for(let r=0;r<e.length;r++){const i=e[r];if(this.options.extensions&&this.options.extensions.renderers&&this.options.extensions.renderers[i.type]){const a=i,o=this.options.extensions.renderers[a.type].call({parser:this},a);if(o!==!1||!["space","hr","heading","code","table","blockquote","list","html","paragraph","text"].includes(a.type)){t+=o||"";continue}}const s=i;switch(s.type){case"space":{t+=this.renderer.space(s);continue}case"hr":{t+=this.renderer.hr(s);continue}case"heading":{t+=this.renderer.heading(s);continue}case"code":{t+=this.renderer.code(s);continue}case"table":{t+=this.renderer.table(s);continue}case"blockquote":{t+=this.renderer.blockquote(s);continue}case"list":{t+=this.renderer.list(s);continue}case"html":{t+=this.renderer.html(s);continue}case"paragraph":{t+=this.renderer.paragraph(s);continue}case"text":{let a=s,o=this.renderer.text(a);for(;r+1<e.length&&e[r+1].type==="text";)a=e[++r],o+=`
`+this.renderer.text(a);n?t+=this.renderer.paragraph({type:"paragraph",raw:o,text:o,tokens:[{type:"text",raw:o,text:o}]}):t+=o;continue}default:{const a='Token with "'+s.type+'" type was not found.';if(this.options.silent)return console.error(a),"";throw new Error(a)}}}return t}parseInline(e,n){n=n||this.renderer;let t="";for(let r=0;r<e.length;r++){const i=e[r];if(this.options.extensions&&this.options.extensions.renderers&&this.options.extensions.renderers[i.type]){const a=this.options.extensions.renderers[i.type].call({parser:this},i);if(a!==!1||!["escape","html","link","image","strong","em","codespan","br","del","text"].includes(i.type)){t+=a||"";continue}}const s=i;switch(s.type){case"escape":{t+=n.text(s);break}case"html":{t+=n.html(s);break}case"link":{t+=n.link(s);break}case"image":{t+=n.image(s);break}case"strong":{t+=n.strong(s);break}case"em":{t+=n.em(s);break}case"codespan":{t+=n.codespan(s);break}case"br":{t+=n.br(s);break}case"del":{t+=n.del(s);break}case"text":{t+=n.text(s);break}default:{const a='Token with "'+s.type+'" type was not found.';if(this.options.silent)return console.error(a),"";throw new Error(a)}}}return t}}class I{constructor(e){g(this,"options");g(this,"block");this.options=e||q}preprocess(e){return e}postprocess(e){return e}processAllTokens(e){return e}provideLexer(){return this.block?w.lex:w.lexInline}provideParser(){return this.block?x.parse:x.parseInline}}g(I,"passThroughHooks",new Set(["preprocess","postprocess","processAllTokens"]));class tn{constructor(...e){g(this,"defaults",z());g(this,"options",this.setOptions);g(this,"parse",this.parseMarkdown(!0));g(this,"parseInline",this.parseMarkdown(!1));g(this,"Parser",x);g(this,"Renderer",j);g(this,"TextRenderer",K);g(this,"Lexer",w);g(this,"Tokenizer",X);g(this,"Hooks",I);this.use(...e)}walkTokens(e,n){var r,i;let t=[];for(const s of e)switch(t=t.concat(n.call(this,s)),s.type){case"table":{const a=s;for(const o of a.header)t=t.concat(this.walkTokens(o.tokens,n));for(const o of a.rows)for(const c of o)t=t.concat(this.walkTokens(c.tokens,n));break}case"list":{const a=s;t=t.concat(this.walkTokens(a.items,n));break}default:{const a=s;(i=(r=this.defaults.extensions)==null?void 0:r.childTokens)!=null&&i[a.type]?this.defaults.extensions.childTokens[a.type].forEach(o=>{const c=a[o].flat(1/0);t=t.concat(this.walkTokens(c,n))}):a.tokens&&(t=t.concat(this.walkTokens(a.tokens,n)))}}return t}use(...e){const n=this.defaults.extensions||{renderers:{},childTokens:{}};return e.forEach(t=>{const r={...t};if(r.async=this.defaults.async||r.async||!1,t.extensions&&(t.extensions.forEach(i=>{if(!i.name)throw new Error("extension name required");if("renderer"in i){const s=n.renderers[i.name];s?n.renderers[i.name]=function(...a){let o=i.renderer.apply(this,a);return o===!1&&(o=s.apply(this,a)),o}:n.renderers[i.name]=i.renderer}if("tokenizer"in i){if(!i.level||i.level!=="block"&&i.level!=="inline")throw new Error("extension level must be 'block' or 'inline'");const s=n[i.level];s?s.unshift(i.tokenizer):n[i.level]=[i.tokenizer],i.start&&(i.level==="block"?n.startBlock?n.startBlock.push(i.start):n.startBlock=[i.start]:i.level==="inline"&&(n.startInline?n.startInline.push(i.start):n.startInline=[i.start]))}"childTokens"in i&&i.childTokens&&(n.childTokens[i.name]=i.childTokens)}),r.extensions=n),t.renderer){const i=this.defaults.renderer||new j(this.defaults);for(const s in t.renderer){if(!(s in i))throw new Error(`renderer '${s}' does not exist`);if(["options","parser"].includes(s))continue;const a=s,o=t.renderer[a],c=i[a];i[a]=(...l)=>{let p=o.apply(i,l);return p===!1&&(p=c.apply(i,l)),p||""}}r.renderer=i}if(t.tokenizer){const i=this.defaults.tokenizer||new X(this.defaults);for(const s in t.tokenizer){if(!(s in i))throw new Error(`tokenizer '${s}' does not exist`);if(["options","rules","lexer"].includes(s))continue;const a=s,o=t.tokenizer[a],c=i[a];i[a]=(...l)=>{let p=o.apply(i,l);return p===!1&&(p=c.apply(i,l)),p}}r.tokenizer=i}if(t.hooks){const i=this.defaults.hooks||new I;for(const s in t.hooks){if(!(s in i))throw new Error(`hook '${s}' does not exist`);if(["options","block"].includes(s))continue;const a=s,o=t.hooks[a],c=i[a];I.passThroughHooks.has(s)?i[a]=l=>{if(this.defaults.async)return Promise.resolve(o.call(i,l)).then(h=>c.call(i,h));const p=o.call(i,l);return c.call(i,p)}:i[a]=(...l)=>{let p=o.apply(i,l);return p===!1&&(p=c.apply(i,l)),p}}r.hooks=i}if(t.walkTokens){const i=this.defaults.walkTokens,s=t.walkTokens;r.walkTokens=function(a){let o=[];return o.push(s.call(this,a)),i&&(o=o.concat(i.call(this,a))),o}}this.defaults={...this.defaults,...r}}),this}setOptions(e){return this.defaults={...this.defaults,...e},this}lexer(e,n){return w.lex(e,n??this.defaults)}parser(e,n){return x.parse(e,n??this.defaults)}parseMarkdown(e){return(t,r)=>{const i={...r},s={...this.defaults,...i},a=this.onError(!!s.silent,!!s.async);if(this.defaults.async===!0&&i.async===!1)return a(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));if(typeof t>"u"||t===null)return a(new Error("marked(): input parameter is undefined or null"));if(typeof t!="string")return a(new Error("marked(): input parameter is of type "+Object.prototype.toString.call(t)+", string expected"));s.hooks&&(s.hooks.options=s,s.hooks.block=e);const o=s.hooks?s.hooks.provideLexer():e?w.lex:w.lexInline,c=s.hooks?s.hooks.provideParser():e?x.parse:x.parseInline;if(s.async)return Promise.resolve(s.hooks?s.hooks.preprocess(t):t).then(l=>o(l,s)).then(l=>s.hooks?s.hooks.processAllTokens(l):l).then(l=>s.walkTokens?Promise.all(this.walkTokens(l,s.walkTokens)).then(()=>l):l).then(l=>c(l,s)).then(l=>s.hooks?s.hooks.postprocess(l):l).catch(a);try{s.hooks&&(t=s.hooks.preprocess(t));let l=o(t,s);s.hooks&&(l=s.hooks.processAllTokens(l)),s.walkTokens&&this.walkTokens(l,s.walkTokens);let p=c(l,s);return s.hooks&&(p=s.hooks.postprocess(p)),p}catch(l){return a(l)}}}onError(e,n){return t=>{if(t.message+=`
Please report this to https://github.com/markedjs/marked.`,e){const r="<p>An error occurred:</p><pre>"+A(t.message+"",!0)+"</pre>";return n?Promise.resolve(r):r}if(n)return Promise.reject(t);throw t}}}const k=new tn;function d(u,e){return k.parse(u,e)}d.options=d.setOptions=function(u){return k.setOptions(u),d.defaults=k.defaults,oe(d.defaults),d};d.getDefaults=z;d.defaults=q;d.use=function(...u){return k.use(...u),d.defaults=k.defaults,oe(d.defaults),d};d.walkTokens=function(u,e){return k.walkTokens(u,e)};d.parseInline=k.parseInline;d.Parser=x;d.parser=x.parse;d.Renderer=j;d.TextRenderer=K;d.Lexer=w;d.lexer=w.lex;d.Tokenizer=X;d.Hooks=I;d.parse=d;d.options;d.setOptions;d.use;d.walkTokens;d.parseInline;x.parse;w.lex;const rn=`# 03 — Benchmark métier v2 : NXT Agent face au marché (France + international)

**Date de recherche : 11 octobre 2026.** Prolonge et met à jour [\`recherche/2026-10-10/03-benchmark-metier.md\`](../../recherche/2026-10-10/03-benchmark-metier.md) (26 solutions, cadrage réseau) et [\`nxt-agent/docs/BENCHMARK-ANALYSE.md\`](../../nxt-agent/docs/BENCHMARK-ANALYSE.md) (analyse documentaire L9). Ces deux documents restent valides ; celui-ci ajoute **~55 acteurs**, les prix publics relevés, les annonces IA 2025-2026, une matrice de 61 fonctionnalités × 15 concurrents, les tendances réglementaires entrées en vigueur en août 2026, une recommandation de prix et 100 fonctionnalités à posséder.

**Produit évalué :** NXT Agent, plateforme immobilière proactive pilotée par IA : parcours vendeur D1–D5 (brief relationnel, marché, quartier, préparation, découverte) puis livrables L1–L9 (email de remerciement, WhatsApp interne, kit réseaux sociaux, lettres de prospection voisins, book de services, analyse de valeur, home staging avant/après, dossier copropriété), CRM, automatisations, console multi-agences. Cible : agences et réseaux français ; pilote à Antibes ; références de marque « Imonovo ».

## 0. Méthode et niveau de preuve

- Recherche web publique (pages éditeurs, presse métier MySweetImmo / HousingWire / Inman / RISMedia / The Negotiator, documentation officielle, agrégateurs d'avis). Quatre recherches parallèles + vérifications ciblées. Aucun compte client, aucune démo privée.
- **Une fonctionnalité citée = déclaration publique**, pas un test. **ND** = non documenté dans les sources consultées, jamais « absent ».
- Prix : relevés le 11/10/2026 sauf mention ; « tiers » = agrégateur/blog, non confirmé par l'éditeur. Les prix ne sont comparables qu'après harmonisation (sièges, agences, modules, engagement).
- Capterra a renvoyé des 403 ; les signaux UX reposent sur G2, avis repris par la presse et pages éditeurs. Ils sont indicatifs.
- « Imonovo » : aucune présence web indexée trouvée (recherche du 11/10/2026). Traité comme référence interne du porteur.

## 1. Synthèse exécutive

1. **Le socle « CRM + IA générative » est devenu une commodité en France.** Hektor (Hektor Voice, Smartpix, rachat de HOQI), Septeo/Modelo (MIA, gratuit pour les clients), Orisha/Immofacile (Scout, Scout Lead by Joe AI), Apimo (rédacteur, staging AI+), Adapt (robot rédacteur, chatbot acquéreurs) proposent tous dictée vocale, rédaction d'annonce et staging. Rien de cela ne différencie NXT.
2. **La course 2026 porte sur les agents proactifs.** À l'international : Lofty Cowork (28/07/2026, agents Sales/Social/Homeowner + serveur MCP), Compass AI Assistant (07/2026, briefing quotidien + vendeurs probables), Reapit RAI (Copilot vocal, marketplace d'agents), Alto Intelligence (six « skills »). En France : Septeo annonce un agentique « qui travaille la nuit » (feuille de route 2026, annonces attendues au RENT 2026), Orisha vend Scout Lead (appels/leads 24/7), efficity a déployé en interne Lya (dictée → fiche → annonce) et une revue de portefeuille quotidienne.
3. **Le parcours vendeur complet reste non couvert.** Aucun acteur public ne relie, à partir d'un même dossier, préparation du RDV, livrables post-RDV (remerciement, kit social, lettres aux voisins, book, analyse de valeur, staging, dossier copro) et suivi. Les proactifs visent surtout les **leads et acheteurs**. C'est le créneau NXT.
4. **La réglementation vient de rebattre l'acquisition vendeur.** Depuis le **11 août 2026**, la prospection téléphonique sans consentement préalable est interdite (loi n° 2025-594, décret n° 2026-662 ; fin de Bloctel). Une pige téléphonique non conforme peut coûter la commission. Les canaux qui montent : **courrier ciblé, contenu local, recommandation, inbound**. Les lettres voisinage (L4) et le kit social (L3) passent du « bonus » au **canal principal**.
5. **AI Act art. 50 applicable depuis le 2 août 2026** : un home staging virtuel publié est plausiblement un « deepfake » au sens de l'art. 3(60) ; le **déployeur (l'agence)** doit l'indiquer de façon perceptible. Le marquage automatique « image virtuelle » + conservation de l'original devient une fonctionnalité de conformité vendable.
6. **Consolidation forte** : La Boîte Immo + HOQI (12/2025) ; Nodalview + ProperShot (09/2025) + Cocoon-Immo (05/2026) ; Septeo = Modelo + Netty + Rodacom + Kinaxia + Cadastre.com ; Compass + Anywhere (clos le 09/01/2026) ; LionDesk fermé (09/2025). Risque de bundles fermés ; opportunité d'être la **couche neutre** au-dessus des CRM.
7. **Les visuels sont banalisés** : staging IA à 0,26–1,6 $ l'image (VirtualStagingAI, Collov), vidéo auto (Danim 2 dès 49 € HT/mois). À inclure, pas à facturer comme différenciant.
8. **La recherche bascule vers les assistants IA** : app Zillow dans ChatGPT (10/2025), app leboncoin dans ChatGPT (02/2026), recherche vocale SeLoger (09/2026), Orpi × Kleio connectant le catalogue de 1 250 sites d'agences à ChatGPT/Claude/AI Overviews (16/06/2026). Les agences doivent être citables par les IA (GEO).
9. **Le marché est porteur** : 940 000 transactions dans l'ancien en 2025 (+11 %), prévision 900–950 k en 2026 ; mandataires ≈ 28 % du marché intermédié (sources MySweetImmo/FNAIM ci-dessous). La pression concurrentielle des mandataires pousse les agences à prouver leur valeur au vendeur — ce que les livrables NXT matérialisent.
10. **Pour le pilote d'Antibes : Apimo est le concurrent local naturel** (agences internationales et luxe de la Riviera, 15+ langues). NXT doit au minimum égaler le multilingue et la qualité premium des supports.

### Ce qui change depuis le benchmark du 10/10/2026

| Sujet | Benchmark v1 | Mise à jour v2 |
|---|---|---|
| Couverture | 26 solutions, surtout CRM réseau | ~55 acteurs, toutes catégories, prix et IA |
| Netty | compté avec Modelo | Confirmé : netty.fr redirige vers modelo.fr ; Modelo = Netty + Rodacom (Septeo) |
| AC3 / Périclès | non traités | AC3 = ancien nom d'Immofacile ; Périclès = Poliris → Orisha |
| Kinaxia | non traité | Septeo depuis 06/2021 (Preventimmo, CityScan → Modelo Insight) |
| Réglementation | RGPD, provenance | + démarchage opt-in 11/08/2026, AI Act art. 50 (02/08/2026), DPE 2026, facturation électronique 01/09/2026 |
| Proactivité | « déjà un axe concurrentiel » (Lofty) | Lofty Cowork, Compass AI Assistant, Septeo agentique, efficity Lya, Scout Lead : axe désormais central |
| Interop IA | n8n, Dust | MCP chez Lofty, BoldTrail BackOffice, Cloze Maia, Yanport ; à prévoir dès la v1 NXT |

## 2. Cartographie du marché

| Catégorie | Acteurs | Rôle vis-à-vis de NXT |
|---|---|---|
| CRM transaction FR (suites) | Septeo/Modelo (ex-Netty), Orisha/Immofacile (ex-AC3, Périclès, Jestimo), La Boîte Immo/Hektor, Apimo, Adapt Immo, Whise, Twimmo | Concurrents et cibles d'intégration (mode « surcouche ») |
| Diffusion / social FR | Ubiflow, Danim, Nodalview (+Cocoon) | Concurrents L3/L8 ; partenaires possibles de diffusion |
| Data / estimation FR | Yanport, PriceHubble, Meilleurs Agents Pro, SeLoger Pro (Estima Pro), Leboncoin Immo Pro, Modelo Insight, Jestimo | Fournisseurs de données D2/L7 ; concurrents de l'analyse de valeur |
| IA / leads FR | Leedflow, Joe AI (dans Scout Lead), Scorimmo, Le Prospecteur | Concurrents ciblés sur la qualification |
| Réseaux avec outils propriétaires | efficity (Lya), iad (Playiad), Orpi (Kleio), Liberkeys, Ma Petite Agence | Substituts « build » ; benchmarks de modèle |
| Visuels IA | VirtualStagingAI, Collov, RoomGPT, Apply Design, REimagine Home, HOQI, Matterport, Startloc (EDL) | Briques à intégrer (L8) |
| CRM US agents/équipes | Follow Up Boss, Lofty, BoldTrail/kvCORE, Real Geeks, Sierra, CINC, Wise Agent, (LionDesk fermé) | Benchmarks d'automatisation et de proactivité |
| IA leads US | Ylopo, Structurely/21X, Revaluate, Offrs | Benchmarks d'agents voix/texte et de signaux vendeurs |
| Plateformes horizontales / brokerages | Salesforce Agentforce, HubSpot Breeze, Propertybase, Cloze, Rechat, Compass | Benchmarks de packaging IA et de prix à l'usage |
| UK / AU / DE | Reapit, Alto (Zoopla), Street.co.uk, Rex, Propstack/Scout24, onOffice | Benchmarks multi-agences et « skills » IA |
| Sites / marketing US | Placester, Luxury Presence, ShowingTime+ (Zillow) | Benchmarks de livrables marketing approuvés |

## 3. Fiches concurrents

Format : **Positionnement / cible · Fonctions clés · IA · Automatisation · Prix (date) · Intégrations · UX & faiblesses · NXT copie / bat.**

### 3.1 CRM et logiciels de transaction — France

**Septeo — Modelo (ex-Netty, Rodacom)** — [modelo.fr](https://www.modelo.fr), [tarifs](https://www.modelo.fr/tarifs), [MIA « intelligence active »](https://www.mysweetimmo.com/2025/11/24/immobilier-lintelligence-active-cest-lia-utile-aux-agents-guillaume-girard-septeo/), [Keller Williams France](https://www.mysweetimmo.com/2025/09/22/immobilier-keller-williams-france-choisit-septeo-pour-accompagner-la-digitalisation-de-ses-agents/), [« parler d'IA c'est déjà has been »](https://www.mysweetimmo.com/2026/07/15/proptech-parler-dintelligence-artificielle-cest-deja-has-been-jesus-diaz-septeo/), [avis Capterra](https://www.capterra.com/p/184513/Netty/reviews/)
- *Positionnement* : chaîne complète de la demande d'estimation à l'acte ; agences et réseaux de mandataires (KW France depuis 09/2025, partenariat FNAIM). Revendique 130 000 utilisateurs, ~4 000 agences, objectif 8 000 fin 2026.
- *Fonctions* : Office (transaction, mandats), InTouch (CRM, email/SMS, relances), Legal (actes, signature, registre LCB-FT), Insight (évaluation, ex-CityScan), Lead Factory (sites), Académie (formation ALUR), Cadastre.com.
- *IA* : **MIA** (commande vocale du CRM, création biens/contacts/relances/estimations, « jusqu'à 8 h/semaine », gratuite), MIA 2 fin 2025 ; annonces auto, staging, matching ; feuille de route 2026 **agentique** (emails entrants, agenda, relance leads froids, campagnes « la nuit ») sur modèle souverain (Lab Brain).
- *Automatisation* : relances InTouch ; couche agentique en déploiement.
- *Prix* : sur devis (11/10/2026). Historique Netty 69 €/mois ; v1 citait Modelo Office dès 119 € HT/mois.
- *Intégrations* : suite interne (Legal, Insight, Cadastre, Preventimmo), MyNotary, Adapt, Danim (vidéo, 10/2026).
- *UX / faiblesses* : Capterra 4,4/5 (83 avis FR) ; simplicité appréciée ; plaintes sur l'écart des estimations et sur le support (avis 06/2026).
- *NXT* : **concurrent agentique le plus direct**. Livrer le briefing matinal et les livrables vendeur avant les annonces RENT 2026 ; cibler les ex-Netty insatisfaits de la migration.

**Orisha Real Estate — Immofacile (ex-AC3) + Périclès + Jestimo** — [realestate.orisha.com](https://realestate.orisha.com), [Immofacile](https://realestate.orisha.com/nos-solutions/immofacile/), [historique AC3](https://www.lejournaldesentreprises.com/article/brest-poliris-et-immofacile-se-rapprochent-pour-creer-ac3-groupe-98091), [Périclès (Appvizer)](https://www.appvizer.fr/construction/agence-immobiliere/pericles)
- *Positionnement* : leader en base installée ; revendique 15 000 agences, 65 000+ agents ; Century 21, Orpi, Plaza cités. Indépendants, groupes, mandataires, franchises.
- *Fonctions* : pige et prospection, avis de valeur et ImmoScope, registre des mandats électronique, inter-cabinet, ImmoDocs (bibliothèque juridique), Créativ'it (gabarits graphiques), mobile avec bon de visite signé ; Jestimo, Immoagenda, ImmoLike, visites 360. Périclès : pilotage CA/équipe (Air et v5).
- *IA (« Scout »)* : copilote voix/texte ; Scout Rédactions (multilingue) ; Scout Image (retouche, staging) ; rédacteur de courriers ; **Scout Lead by Joe AI** : répond et qualifie appels/emails 24/7, crée les contacts, prend RDV, relance les prospects dormants par SMS/WhatsApp.
- *Automatisation* : matching, relance acquéreurs inactifs, **rapports vendeurs automatisés**, traduction.
- *Prix* : ND (devis). Modules IA vendus en upsell.
- *Intégrations* : multidiffusion, signature et LRE (ImmoDocs), gestion locative, leads site.
- *UX / faiblesses* : empilement de modules ; Périclès semble legacy.
- *NXT* : **benchmarker Scout Lead en démo**. Copier les rapports vendeurs automatiques ; battre en livrant le parcours vendeur inclus, pas module par module.

**La Boîte Immo — Hektor** — [la-boite-immo.com](https://www.la-boite-immo.com/logiciel-immobilier), [Hektor Voice (PDF)](https://la-boite-immo.com/sites/default/files/2024-05/hektor-voice.pdf), [rachat HOQI](https://www.mysweetimmo.com/2025/12/04/immobilier-la-boite-immo-rachete-hoqi-startup-specialiste-du-home-staging-assiste-par-ia/), [Hektor 2026](https://www.mysweetimmo.com/2026/03/31/logiciel-de-transaction-comment-les-agences-immobilieres-gagnent-en-efficacite-en-2026/)
- *Positionnement* : « 1er partenaire des agents immobiliers indépendants » ; 8 500+ agences, 45 000 utilisateurs ; aussi groupes.
- *Fonctions* : Hektor 3.0 (refonte fin 2025), CRM automatisé vendeurs/acquéreurs, Interkab Connect (mandats partagés), avis de valeur enrichi PriceHubble, import auto cadastre/syndic/copro, Immosign, mobile temps réel, **WhatsApp**, facturation électronique.
- *IA* : **Hektor Voice** (dictée, annonces, saisie, emails, réponses juridiques ; lancé 05/2024, intégré à 3.0), descriptions IA, Smartpix Pro (retouche, staging), visite virtuelle IA, **HOQI** (staging mobile), états des lieux IA (Etalok), site IA.
- *Automatisation* : multidiffusion, matching auto, workflows vendeur/acquéreur.
- *Prix* : Hektor dès **79 € HT/mois** ; Oskar 60 €, Studio Web 75 €, Akadémie 25 € HT/mois (11/10/2026). Ordre de grandeur tiers : 45–79 €/utilisateur/mois ([Kolonell](https://kolonell.com/fr/blog/logiciel-transaction-immobiliere-sur-mesure-vs-hektor-apimo-2026), intéressé).
- *Intégrations* : portails, Interkab, PriceHubble, WhatsApp, Immosign ; API publique ND.
- *UX / faiblesses* : 4,9 (353 avis affichés par l'éditeur) ; un ex-client le juge daté ; l'IA = plusieurs apps séparées, pas un agent proactif.
- *NXT* : copier l'import automatique de données du bien et le partage de mandats ; battre avec un agent unique qui produit les livrables sans que l'agent ouvre trois outils.

**Apimo** — [apimo.com](https://apimo.com/fr/), [IA et Apimo](https://blog.apimo.net/en/ia-and-apimo), [Leedflow × Apimo](https://apimo.com/nl/actualites/leedflow-apimo)
- *Positionnement* : CRM cloud + sites, 15+ langues, 30+ devises ; agences internationales et luxe (Riviera, Benelux, Italie), franchises. **Concurrent local du pilote Antibes.**
- *Fonctions* : Apimarket (mandats partagés), matching en %, mobile hors ligne, extranet client avec chat, Clap.legal (signature), Clap.lead, Clap.show (vitrines animées).
- *IA* : rédacteur d'annonces, traduction, staging IA (offre AI+), résumés d'appels via Leedflow.
- *Automatisation* : Automator / Automator 2 (constructeur guidé, AI+ seulement).
- *Prix* : **CRM AI 89 €/mois, CRM AI+ 139 €/mois** (HT/TTC et unité non précisés, 11/10/2026).
- *Intégrations* : API groupe SeLoger (SeLoger, Belles Demeures, Logic-immo, Lux Residence), JamesEdition, iNEUF, Roomvo, WhatsApp, Modelo Insight.
- *UX / faiblesses* : IA limitée à la production de contenu ; automatisation réservée au haut de gamme.
- *NXT* : copier la grille à deux offres « AI » lisible et le multilingue ; battre sur la proactivité et la qualité premium des livrables vendeurs (book, analyse, staging) dès l'offre de base.

**Adapt Immo — My Adapt** — [adaptimmo.com](https://www.adaptimmo.com/logiciel-my-adapt/), [IA dans l'app](https://www.mysweetimmo.com/2024/10/29/adapt-immo-integre-lia-dans-son-application-pour-faciliter-le-quotidien-des-agents-immobiliers/), [Inter'Adapt](https://www.adaptimmo.com/interadapt/), [Adapt Connect](https://www.adaptimmo.com/adapt-connect/)
- *Positionnement* : hébergé en France, support Montpellier ; indépendants, groupements, franchises, mandataires, inter-agences ; ~800 clients / 10 000 utilisateurs (2024).
- *Fonctions* : pige, import auto des formulaires, portail propriétaire, mini-sites par bien, registre, outils inter-agences, affiches vitrine, widgets statistiques, mobile.
- *IA* : robot rédacteur, saisie vocale, **chatbot de requalification acquéreurs** (SMS/email → mise à jour critères → propositions), IA calée sur le ton de l'agence.
- *Prix* : ND. *Intégrations* : Adapt Connect (centaines de partenaires : portails, Modelo, MyNotary…) et API.
- *Faiblesses* : sa dirigeante est partie chez Whise (06/2026) ; côté vendeur peu couvert.
- *NXT* : copier la boucle de requalification acquéreurs ; battre sur le côté vendeur.

**Whise** — [whise.eu](https://www.whise.eu/), [Whise France](https://www.mysweetimmo.com/2026/06/01/logiciel-immobilier-sabrina-robles-lebailly-prend-la-tete-de-whise-france/), [Analytics](https://www.whise.eu/fr-fr/produits/analytics/)
- *Positionnement* : éditeur belge, du solo aux marques multi-agences ; 1 880+ agences ; offensive France depuis 06/2026.
- *Fonctions* : pipeline, tâches, client email intégré, campagnes, gabarits brochures, partage temps réel avec le propriétaire, marketplace, API.
- *IA* : rien de livré nommément ; annoncé : enrichissement, scoring de leads, next best action.
- *Automatisation* : séquences de suivi, confirmations/rappels de visite email/SMS, historique automatique.
- *Prix* : gratuit jusqu'à 5 annonces ; payant ND.
- *NXT* : copier la vue propriétaire temps réel ; battre avec une IA déjà en production.

**Ubiflow** — [ubiflow.net](https://www.ubiflow.net), [tarifs](https://www.ubiflow.net/tarifs-immobilier)
- *Positionnement* : pas un CRM ; diffusion (400+ portails), centralisation leads, réseaux sociaux ; 25 000 pros, immo et auto.
- *IA* : textes et visuels de posts par format, **agent WhatsApp de qualification**, réponses IA aux avis Google.
- *Automatisation* : diffusion auto, posts automatiques des biens et des ventes, planification.
- *Prix (HT/mois, engagement, hors frais)* : monodiffusion dès 25 €/flux ; packs diffusion 55/95/135 € par point de vente (WhatsApp IA en Expert) ; packs social 59/89 €.
- *NXT* : copier « post vendu automatique » ; **intégrer Ubiflow plutôt que reconstruire 400 flux**.

**Twimmo** — [twimmo.com](https://www.twimmo.com) — sites d'agence + logiciel transaction pour petites agences (3 000 sites, 2 500 utilisateurs revendiqués) ; génération documentaire, marketplace inter-agences ; IA vague ; prix ND. *NXT* : concurrent bas de gamme, aisément dépassé.

**Kinaxia (Septeo)** — racheté 06/2021 : Preventimmo (documents risques), CityScan (→ Modelo Insight), Copro Expertises. Pas un CRM. *NXT* : montre où se trouvent les données pour L7 et L9 ; prévoir une source équivalente (ERP/Géorisques, DVF, données copro).

**Ma Petite Agence** — réseau de franchise (neuf, coaching) avec CRM interne non commercialisé ([toute-la-franchise](https://www.toute-la-franchise.com/news-550255-mapetiteagence-com-entrepreneurs-formation.html)). Client réseau potentiel, pas concurrent logiciel.

**Autres FR à suivre** : Realty (99 € HT/mois pour 5 utilisateurs, déclaratif, [G2](https://www.g2.com/sellers/groupe-realty)) ; ImmoIntel (estimateur DVF) ; MeilleursBiens Néo (logiciel avec ChatGPT). Allemagne pour comparaison : Propstack (Scout24) à 99 €/licence/mois + 279 € de mise en place, suite PropstackAI (voix → exposé, staging, Floorscanner, DeepL) ([ki-syndikat](https://www.ki-syndikat.de/tools/propstack/)) ; Scout24 présente un « Agentic OS for Real Estate » ([onlinemarketplaces](https://www.onlinemarketplaces.com/articles/scout24-capital-markets-day-agentic-os-for-real-estate-revealed-as-all-2024-targets-hit/)).

### 3.2 Données, estimation, portails — France

**Yanport — Agent 360** — [yanport.com](https://www.yanport.com/solutions/agent-360), [tarifs](https://www.yanport.com/tarifs/agent-360), [partenariat iad](https://www.mysweetimmo.com/2024/09/30/proptech-iad-noue-un-partenariat-avec-yanport/), [observatoire](https://www.mysweetimmo.com/2025/06/30/pros-de-limmo-yanport-lance-son-observatoire-des-marches-immobiliers/)
- *Positionnement* : data marché et estimation pour titulaires de carte T ; aussi ADB 360, Invest 360, Data 360, API/MCP.
- *Fonctions* : pige, avis de valeur, comparables en vente/vendus/invendus, veille mandats et baisses de prix, détection des concurrents en mandat simple, observatoire (06/2025).
- *IA* : modèle d'estimation ML entraîné sur 500 000+ paires annonce/vente ; page « MCP et agent IA » sans détail.
- *Prix* : **39 € HT/utilisateur/mois**, sans engagement, dégressif (fiche commerciale ; la page officielle masque les prix).
- *Intégrations* : Dôme, API (Optimhome/Capifrance, Homeloop, Khome), ~13 000 conseillers iad via Playiad.
- *Faiblesses* : outil data, pas de livrable rédigé ni marketing.
- *NXT* : utiliser ce niveau de comparables (ou Yanport en partenaire), mais le **transformer en récit lisible par le vendeur** (L6/L7).

**PriceHubble** — [pricehubble.com/fr](https://www.pricehubble.com/fr/use-cases/logiciel-estimation-immobiliere)
- *Positionnement* : AVM et analytics européen ; banques, assureurs, agences ; données reprises par Hektor.
- *Fonctions / IA* : AVM (appartements, maisons), approche SEED/SIGNAL/SELL : signaux d'intention vendre/acheter/déménager/rénover/risques sur la base client ; mises à jour majeures du modèle 02 et 09/2025.
- *Prix* : ND (démo). *Faiblesses* : vente entreprise, opaque.
- *NXT* : copier la boucle **signal → action** appliquée au CRM de l'agence, en libre-service.

**Meilleurs Agents Pro (Aviv)** — [pro.meilleursagents.com](https://pro.meilleursagents.com), [Carte de prospection](https://edito.meilleursagents.com/professionnels-immobiliers/business/make-it-business-carte-de-prospection-meilleurs-agents-mandats)
- *Offres* : fiche gratuite ; Essentiel (fiche MA + SeLoger, avis, biens vendus), Expert (+ Inventory, base des ventes), Élite (+ Carte de prospection) ; options RDV vendeur qualifié, Boost.
- *IA* : rien d'annoncé. *Prix* : non publié ; témoignage ancien ~850 €/mois minimum (anecdotique).
- *Faiblesses* : avis sur un rapport qualité/prix faible, leads souvent locatifs.
- *NXT* : carte de prospection construite sur les données de l'agence + DVF, **sans taxe d'exclusivité**, débouchant directement sur des lettres voisinage.

**SeLoger Pro (Aviv)** — [recherche vocale SeLoger](https://www.mysweetimmo.com/2026/09/11/immobilier-seloger-permet-de-chercher-un-bien-en-parlant/)
- *Fonctions* : app My SeLoger Pro (leads, call tracking), Estima Pro, Top Position ; promesse « +20 % de leads qualifiés » (éditeur) ; recherche intelligente vocale côté acheteur (09/2026).
- *Règle notable* : les photos virtuelles doivent être signalées comme telles.
- *NXT* : étiquetage automatique conforme aux règles portails ; battre Estima Pro sur la lisibilité vendeur.

**Leboncoin Immo Pro** — [nouvelles fonctions 2025](https://www.mysweetimmo.com/2025/03/07/pros-de-limmo-leboncoin-immo-lance-de-nouvelles-fonctionnalites-pour-booster-votre-business/), [« l'IA va transformer les annonces »](https://www.mysweetimmo.com/2025/06/09/immobilier-lia-va-transformer-les-annonces-immobilieres-iris-porto-leboncoin/), [app ChatGPT](https://www.mysweetimmo.com/2026/02/10/petites-annonces-le-catalogue-leboncoin-desormais-accessible-en-conversant-directement-avec-chatgpt/)
- *Fonctions* : recommandation de prix IA + rapport d'estimation (01/2025), scoring « hot or not » (test), call tracking, remontée d'annonces IA, emailings pour mandats exclusifs ; app dans ChatGPT (02/2026).
- *IA* : rédaction d'annonce « en préparation » (06/2025), sélection auto de la meilleure photo prévue.
- *NXT* : livrer dès maintenant texte et choix de photo, **neutres vis-à-vis des portails**.

**Modelo Insight (Septeo)** et **Jestimo (Orisha)** — estimation intégrée à leurs suites ([Modelo Insight](https://www.septeo.com/fr/offres/modelo-insight), [Jestimo](https://realestate.orisha.com/nos-solutions/jestimo/)). Plaintes publiques sur l'écart des estimations chez Modelo. *NXT* : l'estimation DVF est un standard ; la valeur est dans **l'explication sourcée et la fourchette assumée**.

### 3.3 Médias, visuels et contenus — France et outils IA

**Danim 2** — [lancement 09/2026](https://www.mysweetimmo.com/2026/09/14/immobilier-danim-2-veut-simplifier-la-vie-des-agents-grace-a-lia/), [Modelo × Cadastre.com × Danim](https://www.mysweetimmo.com/2026/10/05/agent-immobilier-transformez-vos-annonces-en-videos-sans-montage/)
- *Positionnement* : marketing digital IA pour conseillers ; 5 000+ utilisateurs revendiqués ; levée 2,5 M€.
- *Fonctions / IA* : vidéo depuis annonce, retouche et effacement d'objets, staging virtuel, rédaction de posts IA, choix de gabarits, planification Instagram/LinkedIn/TikTok ; données biens importées depuis Modelo/Cadastre.com.
- *Prix* : **49 / 69 / 89 € HT/mois** (offres mandataires), essai 7 jours.
- *NXT* : **rival français le plus proche du kit social (L3)**. Le battre en reliant le kit au stade du mandat (nouveau mandat, baisse de prix, compromis, vendu) et au dossier vendeur, sans ressaisie.

**Nodalview (+ ProperShot, Cocoon-Immo)** — [tarifs](https://nodalview.com/fr/tarifs), [staging](https://nodalview.com/fr/home-staging-virtuel)
- *Fonctions* : photo HDR smartphone, plans 2D, visites 360, vidéo, Smart Links ; gestion réseaux sociaux et fiche Google via Cocoon (1 500 clients, en partie humaine).
- *IA* : staging, Magic Enhance, Magic Eraser, remplacement de ciel, rénovation virtuelle, vidéo IA depuis photos.
- *Prix* : dès **79 €/mois** + crédits (photo 1, vidéo/visite/plan 15, IA 1–3 ; jusqu'à 0,60 €/crédit) — propos du CEO relayés par MySweetImmo (12/2025) ; page officielle sur devis.
- *Faiblesses* : calcul de crédits confus ; pas de rédaction IA trouvée.
- *NXT* : prix forfaitaire lisible et posts entièrement automatiques ; intégrer Nodalview comme source photo.

**Staging virtuel IA (briques)**

| Outil | Prix public (11/10/2026) | Points notables |
|---|---|---|
| [VirtualStagingAI](https://www.virtualstagingai.app/prices) | 16 $ (6 photos) · 19 $ (20) · 39 $ (60) · 79 $ (150, API) /mois | rendus illimités, retrait de meubles, ~10 s |
| [Collov AI](https://collov.ai/pricing) | 19 $ (60 crédits) · 49 $ (150) · 79 $ (263) · 127 $ (526, API) | multi-angles, édition par chat, crépuscule, vidéo, 360 |
| [Apply Design](https://www.applydesign.io) | 7–10 $/image (jetons) | 1re image offerte, 360° |
| RoomGPT | packs ~9–29 $ (tiers) | design générique, non orienté conformité immobilière |
| REimagine Home | 14–149 $/mois (tiers, contradictoires) | — |
| HOQI | ND | racheté par La Boîte Immo (12/2025) |
| [Matterport](https://matterport.com/plans) | hausse au 20/05/2025, montants ND | **Defurnish** (vidage du jumeau 3D), **Property Intelligence** (descriptions, mesures) |

*NXT* : le staging coûte ~0,3–1 $ l'image : **l'inclure**, avec étiquette « image virtuelle » incrustée, original conservé, curseur avant/après et règles anti-tromperie (pas de suppression de défauts, pas de modification de volume ni de vue).

**Startloc** — [startloc.fr](https://www.startloc.fr) — états des lieux ; 11 000 utilisateurs ; dictée et **photo → description d'état** ; Pro 290 €/an jusqu'à 5 utilisateurs. *NXT* : réutiliser le motif photo → constat pour D5 et L9.

### 3.4 IA, leads et outils propriétaires des réseaux — France

**efficity — Lya et assistant CRM** — [contenu sponsorisé 07/2026](https://www.mysweetimmo.com/2026/07/07/immobilier-efficity-transforme-ses-conseillers-en-experts-augmentes-avec-lia/), [brochure](https://recrutement.efficity.com/download_brochure/)
- Assistant conversationnel dans le CRM (90 % d'adoption revendiquée) ; **Lya** : après visite, dictée → fiche bien → mise à jour CRM → annonce ; **revue de portefeuille quotidienne avec actions prioritaires** ; estimation entraînée sur 20 ans de données ; détection prédictive de projets annoncée. Interne, non commercialisé.
- *NXT* : **modèle le plus proche du concept NXT**, mais captif. Le proposer aux agences indépendantes et aux réseaux sans DSI.

**iad — Playiad** — [politique Playiad Assistant](https://www.iadfrance.fr/politique-de-confidentialite-playiad-assistant) — app ~15 000 conseillers ; pige via Yanport, avis de valeur, signature, multidiffusion, Playiad Easy Admin avec Indy (02/2026) ; notes vocales volontaires. *NXT* : les réseaux assemblent des briques ; NXT peut être la couche qui les relie.

**Orpi × Kleio** — [étude de cas](https://www.kleio.ai/case-studies/orpi), [CX Network](https://www.cxnetwork.com/cx-experience/articles/ai-search-for-real-estate-how-frances-orpi-is-driving-the-conversation) — 16/06/2026 : assistant multi-agents sur Orpi.com et 1 250 sites d'agences, catalogue connecté nativement à ChatGPT, Google AI Overviews et Claude ; « +20 % de leads » (chiffre éditeur). *NXT* : prévoir l'exposition des biens et du savoir local aux moteurs IA (pages structurées, llms.txt, flux).

**Leedflow** — [leedflow.com](https://www.leedflow.com/) — capture des appels, synthèse, mise à jour fiche, rappels ; 1,5 M€ levés (05/2026) ; dès 89 € HT/mois (FAQ citée en v1). *NXT* : résumé d'appel → CRM en natif, ou intégration.

**Liberkeys** — [liberkeys.com](https://www.liberkeys.com) — néo-agence au forfait **6 500 € payé au succès** ; dossier d'estimation sous 24 h ; photos, visite, plan ; diffusion 30+ portails ; **portail vendeur temps réel** ; actionnaire Crédit Mutuel Arkéa. *NXT* : référence d'expérience vendeur transparente.

**Autres** : Scorimmo (qualification humaine, [site](https://www.scorimmo-transaction.fr/)) ; Le Prospecteur (événements déclencheurs, 89 €/mois, [Gumroad](https://lesheros.gumroad.com/l/leprospecteur-immobilier)) ; Zestia « Maude » (assistants pour franchisés) ; Homepilot = gestion locative (groupe iad), hors périmètre vendeur. **Non trouvés** malgré recherche : Hestia, Imoxa (uniquement des agences homonymes), Kiwiz, Stello, « Gemini immo ».

### 3.5 CRM et IA — États-Unis

**Lofty (ex-Chime)** — [Cowork](https://lofty.com/news/lofty-cowork), [RISMedia 28/07/2026](https://www.rismedia.com/2026/07/28/lofty-expands-agentic-ai-os-real-estate-cowork), [prix](https://lofty.com/pricing), [Custom Agents](https://lofty.com/ai/custom-agents)
- *Positionnement* : « agentic AI operating system » pour agents, équipes, brokers, enterprise ; interface reconstruite autour de **Cowork** (chat).
- *Fonctions* : site IDX, CRM, génération de leads (ads), Social Studio, Lofty Blast (bien → pubs Facebook/Instagram + email), House.ai (préparation acheteur).
- *IA* : Cowork classe les tâches du jour, **explique pourquoi**, propose l'étape suivante et l'exécute en un clic ; agents nommés **Sales** (ISA 24/7), **Social**, **Homeowner** (pipeline vendeurs depuis la base) ; agents personnalisés, bibliothèque, tâches IA planifiées ; Agent Studio (bêta, modèles OpenAI/Anthropic/Google) ; **serveur MCP**.
- *Automatisation* : Smart Plans (email, SMS, appel, **courrier**), routage, social automatisé.
- *Prix* : sur demande ; frais publics : 20 % gestion pub, 15 % sphere ads, 70 $/mois page d'estimation. Tiers : ~449 $/mois + IA ~60 $ ([Rework](https://resources.rework.com/tools/ai-agents/best-ai-agents-for-real-estate-2026)).
- *UX / faiblesses* : Capterra 3,9 (127) ; prix opaques ; courbe d'apprentissage ; agentique décrit surtout par communiqués.
- *NXT* : **référence d'UX proactive** (« pourquoi + exécuter en un clic ») et de l'agent Homeowner ; battre par les livrables vendeur et l'adaptation au droit français.

**Follow Up Boss (Zillow)** — [prix](https://www.followupboss.com/pricing), [ouverture](https://www.followupboss.com/open), [Zillow Pro](https://www.inman.com/2026/07/09/zillow-takes-zillow-pro-nationwide-after-8-month-rollout/)
- *Positionnement* : CRM lead-to-close orienté vitesse de réponse ; cœur de Zillow Pro (national depuis 09/07/2026).
- *Fonctions* : routage depuis 200+ sources, appels/SMS/email, dialer, boîtes partagées, « teams within teams », excellente app mobile.
- *IA* : Smart Summaries, **Smart Messages** (suggestions, 06/2025), Suggested Tasks, priorisation prédictive ; pas d'agent vocal natif.
- *Automatisation* : Action Plans, Smart Lists, Automations.
- *Prix* : Grow **69 $/utilisateur/mois** (58 $ annuel), appels +39 $ ; Pro 499 $/mois pour 10 ; Platform 1 000 $/mois pour 30 (11/10/2026). IA sans surcoût.
- *Intégrations* : 250+, API ouverte. *Avis* : G2 4,6 ; Capterra 4,5.
- *Faiblesses* : IA suggère mais n'agit pas ; dépendance croissante à Zillow.
- *NXT* : copier la simplicité des Smart Lists et la vitesse ; battre par l'action proactive.

**BoldTrail / kvCORE (Inside Real Estate)** — [solution](https://insiderealestate.com/solution/), [HomeSearch AI](https://www.realestatenews.com/2025/08/21/boldtrail-unveils-ai-home-search), [MCP BackOffice](https://www.inman.com/2026/08/11/boldtrail-mcp-ai-assistants/)
- *Positionnement* : plateforme brokerage/franchise (kvCORE, BoomTown, btPRO, Brokermint) ; 400 000 utilisateurs revendiqués.
- *IA* : Smart CRM (scoring, automatisation comportementale), HomeSearch AI (08/2025), ComplianceAI (08/2026), **MCP BackOffice** (08/2026) ; Concierge AI (tiers).
- *Automatisation* : Smart Campaigns, Marketing Autopilot multicanal, routage.
- *Prix* : devis ; tiers ~300 $/agent/mois.
- *Faiblesses* : lourd, beaucoup d'exécution manuelle.
- *NXT* : copier la hiérarchie « business within a business » pour la console réseau ; battre sur la simplicité.

**Ylopo** — [ylopo.com](https://www.ylopo.com) — leads + nurture IA ; **AI Text** (depuis 2018) et **AI Voice** (appels sortants, qualification, transfert chaud, suivi 90 jours, multilingue) ; déclencheurs d'intention (visites répétées, favoris, recherches) ; Seller Report (AVM) ; prix sur devis (tiers ~295 $/mois + setup). *NXT* : la boucle **signal d'intention → message IA → transfert humain** est le meilleur modèle proactif du groupe.

**Structurely / 21X** — [structurely.com](https://www.structurely.com/pricing) — ISA IA voix/SMS/email/chat, transferts en direct ; devenu généraliste (immo, crédit, assurance) ; **usage : voix dès 0,07 $/min, SMS 0,02 $, email 0,02 $** + frais de plateforme ; tiers : 499 $/mois + 2 000 $ setup. *NXT* : étalon de coût unitaire voix/texte.

**Real Geeks** — [prix](https://www.realgeeks.com/pricing) — 399 $/mois + 500 $ setup (2 utilisateurs) ; packs leads 299–599 $ ; **Geek AI Text 49 $/mois** (offert avec un pack) ; Voice « bientôt ». *NXT* : copier la transparence prix avec IA incluse dans un pack.

**Sierra Interactive** — IDX + CRM ; Starter 299,95 $/mois, Essential 399,95 $, Growth 599,95 $ (12 mois, tiers 2026) ; **Sierra AI** (ex-Lead Engage) SMS 12 mois : add-on 199 $/mois. *NXT* : ne pas faire payer une « taxe IA ».

**CINC** — [cincpro.com](https://www.cincpro.com) — ads gérées, leads vendeurs RealVerified, IDX, CRM ; CINC AI (SMS 24/7, historiquement Structurely) avec **panneau de reprise humain/bot** et score d'intention ; devis (tiers : IA ~200 $/mois). *NXT* : copier le contrôle explicite de reprise humaine.

**Wise Agent** — [prix](https://www.wiseagent.com/pricing) — 49 $/mois (42 $ annuel) jusqu'à 5 membres ; +WiseSocial 69 $ ; IA rédaction et réponse aux leads ; interface jugée datée. *NXT* : rester dans cette zone de prix pour les indépendants avec une UX nettement supérieure.

**LionDesk** — [fermeture annoncée 05/2025](https://www.inman.com/2025/05/16/lone-wolf-technologies-to-wind-down-popular-liondesk-crm/), fermé 09/2025 (migration Lone Wolf Relationships). *Leçon* : les CRM de niche sont absorbés ou fermés ; prévoir import/export complet.

**Rechat (Lucy)** — [HousingWire](https://www.housingwire.com/articles/rechat-launches-lucy-an-ai-agent-assistant/), [RISMedia](https://www.rismedia.com/2025/07/28/rechat-releases-lucy-ai-agent-assistant/)
- *Positionnement* : super-app « AI-first » CRM + marketing pour brokerages US ; modules Studio (marketing de marque), People (CRM), Deals (transaction/conformité), **Lucy** (IA transverse, 07/2025).
- *IA* : AI Marketing Center : posts sociaux, campagnes email, descriptions, **CMA**, sites de bien ; lecture de documents de transaction.
- *Prix* : non publié (tiers ~100 $/utilisateur/mois). *Faiblesses* : achat via brokerage ; Lucy réactive.
- *NXT* : **analogue le plus proche des livrables L3/L5/L7** ; copier les kits verrouillés à la marque ; battre par des livrables déclenchés sans demande.

**Compass — AI Assistant** — [RISMedia 21/07/2026](https://www.rismedia.com/2026/07/21/compass-expands-ai-capabilities-ai-assistant-home-platform/), [Inman 06/2025](https://www.inman.com/2025/06/17/compass-ai-is-poised-to-bring-agents-massive-productivity-gains/), [fusion Anywhere](https://pulse2.com/compass-completes-all-stock-combination-with-anywhere-real-estate/amp/)
- Fusion avec Anywhere close le 09/01/2026 (~340 000 agents : Coldwell Banker, Corcoran, ERA, Sotheby's IR). AI Assistant (07/2026) : **briefing quotidien**, opportunités « Likely to Sell » proactives, rédaction des relances, admin ; marques en propre 2026, franchisés 2027. Captif.
- *NXT* : **meilleur modèle de « proactivité vendeur »** ; NXT doit l'égaler pour les indépendants et réseaux français.

**Cloze (Maia)** — [annonce](https://salestechstar.com/sales-marketing/cloze-introduces-maia-a-voice-enabled-ai-assistant-for-real-estate/), [William Raveis](https://www.housingwire.com/articles/william-raveis-raveis365-plus-platform-cloze-ai-relationship-intelligence/) — CRM relationnel à capture automatique ; **Maia** (bêta 09/2025) voix/texte → actions ; **compatible MCP** (utilisable depuis Claude.ai) ; pré-remplissage de formulaires (05/2026) ; 17–42 $/utilisateur/mois (tiers). *NXT* : copier voix → action et l'exposition MCP.

**HubSpot (Breeze)** — [IA HubSpot](https://www.hubspot.com/products/artificial-intelligence) — CRM horizontal ; Breeze Prospecting/Customer/Content Agents ; crédits mensuels (500–5 000) ; **tarification au résultat** : Prospecting Agent 1 $/lead recommandé, Customer Agent 0,50 $/conversation résolue (depuis 14/04/2026, tiers). *NXT* : copier le **prix au résultat** pour les livrables ; battre par les objets immobiliers natifs.

**Salesforce (Agentforce)** — [immobilier](https://www.salesforce.com/solutions/industries/real-estate/), [Ascendix](https://ascendix.com/blog/salesforce-agentforce-real-estate/) — pas de Real Estate Cloud natif ; agents SDR/Service via partenaires ; ~2 $/conversation (partenaire). *NXT* : battre par le zéro intégrateur.

**Propertybase (Lone Wolf)** — [Capterra](https://www.capterra.com/p/10020285/Propertybase-Go/), [Lone Wolf IA](https://www.housingwire.com/articles/lone-wolf-bets-future-of-real-estate-ai-is-embedded-not-standalone/) — GO et Salesforce Edition (dès 79 $/utilisateur/mois, 10 minimum) ; Lone Wolf « Aspen » (coéquipier IA) et « Talent » (prédiction de départ d'agents) annoncés 28/07/2026, GA automne 2026. *NXT* : l'analytics de rétention des agents est un argument réseau.

**Revaluate** — [revaluate.com](https://www.revaluate.com) — score « likely to move » sur la base de l'agent ; **audit des mandats manqués sur 12 mois** ; intégrations FUB, Lofty, BoldTrail, Sierra… *NXT* : copier l'audit « ventes manquées dans votre fichier » (DVF × CRM) comme accroche d'onboarding.

**Offrs** — [HousingWire](https://www.housingwire.com/articles/offrs-review) — prédiction vendeurs à 12 mois (250+ variables) ; territoires exclusifs ~399–800 $/mois/code postal (tiers) ; assistant RAIA. *NXT* : copier l'**attribution territoriale** pour les réseaux, sans vendre de fichiers (RGPD).

**Luxury Presence** — [AI Marketing Team](https://www.luxurypresence.com/blogs/luxury-presence-debuts-the-first-fully-autonomous-ai-marketing-team/), [BusinessWire](https://www.businesswire.com/news/home/20250730170189/en) — « équipe marketing IA autonome » (08/2025) : spécialistes Ads, SEO, Blog, Lead Nurture ; **chaque action approuvée/rejetée dans un tableau de bord** (99,51 % acceptées en bêta, chiffre éditeur) ; devis, 12 mois. *NXT* : copier le cadrage « spécialistes IA » + file d'approbation.

**Placester** — sites IDX 59–129 $/mois ; constructeur IA (11/2025) ; **llms.txt automatique** sur chaque site. *NXT* : préparation des sites d'agence au référencement IA.

**ShowingTime+ (Zillow)** — gestion des visites, Appointment Center, Offer Manager, rapports de prix ; **staging IA dans Showcase activable par l'acheteur** (09/2025). *NXT* : staging présenté comme option réversible côté acheteur = bonne pratique de transparence.

### 3.6 Royaume-Uni et Australie

**Reapit (RAI)** — [annonce RAI](https://www.reapit.com/content-hub/reapit-announces-reapit-ai-rai-an-ai-assistant-set-to-transform-estate-agency-operations), [direction 2026](https://www.reapit.com/press-releases/reapit-sets-the-direction-for-the-ai-powered-estate-agency), [multi-branch](https://www.reapit.com/solutions/multi-branch)
- CRM entreprise multi-agences UK/AU ; RAI annoncé 06/2025 (scoring, relances, **Listing Concierge** collectant données et photos vendeur, descriptions dans la voix de l'agence) ; 04/2026 : **RAI Copilot** vocal mobile, **RAI AppMarket** (agents de tâches partenaires), **RAI Builder** (no-code), assistant de visite, saisie acquéreurs IA ; données isolées par agence. Prix ND.
- *Faiblesses* : écart annonce/livraison ; le Listing Concierge a disparu des messages 2026.
- *NXT* : copier marketplace d'agents et builder pour la console réseau ; **battre en livrant le « Listing Concierge » (parcours vendeur) maintenant**.

**Alto (Zoopla) — Alto Intelligence** — [six skills 09/2026](https://www.altosoftware.co.uk/blog/whats-new-in-alto-intelligence-six-skills-live-from-september/), [Estate Agent Today](https://www.estateagenttoday.co.uk/breaking-news/2026/04/alto-claims-20-years-of-data-makes-it-the-winner-in-ai-race/)
- 6 000+ agences ; Alto IQ (analyste IA gratuit, risque de chute de vente, signaux acheteurs), Prospecting, Lead Flow 24/7, Smart Listings ; depuis 09/2026 six « skills » : **appraisal builder (rapport + comparables classés)**, alertes, rédacteur d'annonces, relanceur de progression, IQ, rédacteur d'emails ; WhatsApp via Bridge AI. Prix ND.
- *NXT* : copier l'appraisal builder et le packaging en « skills » ; battre avec la totalité des livrables vendeur.

**Street.co.uk** — [reporting](https://street.co.uk/solutions/reporting), [mise à jour 07/2025](https://street.co.uk/blog/whats-new-in-street-co-uk-development-update-july-2025) — 200+ mises à jour/an ; onboarding IA (plan + photos → annonce dans le ton de l'agence), retouche IA, standard IA hors horaires, **rapports de performance d'annonce pour le vendeur**, « Cortex » (emails personnalisés en masse, dès 149 £/mois). *NXT* : copier le rapport vendeur et l'annonce depuis photos.

**Rex (AU/NZ/UK)** — [mises à jour IA](https://www.rexsoftware.com/updates/ai-improvements) — 13 000 utilisateurs ; Rex AI (recherche en langage naturel, brouillons email/SMS, descriptions, pubs) ; **AI Admin et AI Prospecting en production** ; **Rex Reach** : pubs sociales générées depuis la base avec reporting vendeur. *NXT* : copier Rex Reach (pubs + rapport vendeur).

## 4. Matrice d'écarts fonctionnels (61 fonctionnalités × 15 concurrents)

**Légende** : ● documenté publiquement · ◐ partiel, module payant, partenaire ou feuille de route annoncée · \`·\` non documenté (ND ≠ absent). Colonne **NXT** = priorité proposée (P0 = pilote Antibes, P1 = généralisation réseau, P2 = plus tard).
**Colonnes** : HK Hektor · AP Apimo · IF Immofacile/Orisha · MO Modelo/Septeo · AD Adapt Immo · WH Whise · UB Ubiflow · YA Yanport · NV Nodalview · DA Danim · LO Lofty · FU Follow Up Boss · BT BoldTrail · RC Rechat · AL Alto.
Choix des 15 : les 6 CRM français les plus présents, 4 spécialistes français (diffusion, data, visuels, social) et 5 références internationales de proactivité. Compass (captif), Reapit, Ylopo et Luxury Presence sont commentés en § 3.

| # | Fonctionnalité | HK | AP | IF | MO | AD | WH | UB | YA | NV | DA | LO | FU | BT | RC | AL | NXT |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| | **A. Socle CRM / transaction** | | | | | | | | | | | | | | | | |
| 1 | Fiche bien, mandats, registre | ● | ● | ● | ● | ● | ● | · | · | · | · | ◐ | · | ◐ | ◐ | ● | P0 |
| 2 | Contacts vendeurs/acquéreurs, historique unifié | ● | ● | ● | ● | ● | ● | ◐ | · | · | · | ● | ● | ● | ● | ● | P0 |
| 3 | Rapprochement acquéreurs automatique | ● | ● | ● | ● | ● | ● | · | · | · | · | ● | ◐ | ● | · | ◐ | P1 |
| 4 | Diffusion multi-portails | ● | ● | ● | ● | ● | ● | ● | · | · | · | · | · | · | · | ● | P1 (intégration) |
| 5 | Pige des annonces de particuliers | · | · | ● | · | ● | · | · | ● | · | · | · | · | · | · | · | P2 (partenaire) |
| 6 | Partage de mandats inter-agences | ● | ● | ● | · | ● | · | · | · | · | · | · | · | · | · | · | P1 |
| 7 | Signature électronique | ● | ● | ● | ● | ◐ | · | · | · | · | · | · | · | ◐ | ● | · | P1 (intégration) |
| 8 | Agenda, visites, confirmations SMS/email | ● | ● | ● | ◐ | ● | ● | · | · | · | · | ● | ◐ | ● | · | ● | P1 |
| 9 | Portail propriétaire temps réel | · | ● | · | ● | ● | ● | · | · | · | · | · | · | · | · | · | P0 |
| 10 | Rapport vendeur automatisé (commercialisation) | · | · | ● | · | · | ◐ | · | · | · | · | · | · | · | · | ◐ | P0 |
| 11 | Application mobile terrain | ● | ● | ● | ● | ● | ◐ | · | · | ● | ◐ | ● | ● | ● | ● | ◐ | P0 |
| 12 | Import auto des données du bien (cadastre, copro, DPE) | ● | · | · | ● | · | · | · | ◐ | · | ◐ | · | · | · | · | · | P0 |
| | **B. IA générative et livrables** | | | | | | | | | | | | | | | | |
| 13 | Rédaction d'annonce IA | ● | ● | ● | ● | ● | · | ◐ | · | · | ◐ | ◐ | · | · | ● | ● | P0 |
| 14 | Traduction / multilingue | ◐ | ● | ● | · | · | · | · | · | · | · | · | · | · | · | · | P0 (Riviera) |
| 15 | Assistant vocal → actions CRM | ● | · | ● | ● | ● | · | · | · | · | · | ◐ | · | · | · | · | P1 |
| 16 | Compte rendu de RDV dicté → fiche structurée | ● | · | ◐ | ◐ | ◐ | · | · | · | · | · | · | ◐ | · | · | · | P0 |
| 17 | Email de remerciement post-RDV généré (L1) | · | · | · | · | · | · | · | · | · | · | ◐ | ◐ | · | ◐ | ◐ | P0 |
| 18 | Brief interne d'équipe WhatsApp/Slack (L2) | · | · | · | · | · | · | · | · | · | · | · | · | · | · | · | P0 |
| 19 | Kit réseaux sociaux par bien (L3) | · | · | ◐ | ◐ | · | · | ● | · | ◐ | ● | ● | · | ◐ | ● | · | P0 |
| 20 | Posts automatiques par jalon (mandat, baisse, vendu) | · | · | · | · | · | · | ● | · | ◐ | ● | ● | · | · | ● | · | P0 |
| 21 | Lettres de prospection voisinage (L4) | · | · | ◐ | · | · | · | · | · | · | · | ◐ | · | · | · | · | P0 |
| 22 | Book de services / présentation de mandat (L5) | · | · | · | · | · | · | · | · | · | · | · | · | · | ◐ | · | P0 |
| 23 | Analyse / avis de valeur rédigé (L6–L7) | ● | ◐ | ● | ● | ◐ | · | · | ● | · | · | ◐ | · | · | ● | ● | P0 |
| 24 | Home staging virtuel (L8) | ● | ● | ● | ● | · | · | · | · | ● | ● | · | · | · | · | · | P0 |
| 25 | Avant/après + étiquette « image virtuelle » + original conservé | · | · | · | · | · | · | · | · | · | · | · | · | · | · | · | P0 |
| 26 | Vidéo automatique depuis l'annonce | · | ◐ | · | ◐ | · | · | · | · | ● | ● | · | · | · | · | · | P2 |
| 27 | Dossier copropriété / analyse de pièces (L9) | ◐ | · | · | ◐ | · | · | · | · | · | · | · | · | · | ◐ | · | P1 |
| 28 | Retouche photo IA | ● | · | ● | · | · | · | · | · | ● | ● | · | · | · | · | · | P1 |
| | **C. Préparation et proactivité** | | | | | | | | | | | | | | | | |
| 29 | Brief relationnel pré-RDV vendeur (D1) | · | · | · | · | · | · | · | · | · | · | ◐ | ◐ | · | · | · | P0 |
| 30 | Étude de comparables vendus (D2, DVF) | ◐ | ◐ | ● | ● | · | · | · | ● | · | · | · | · | · | ◐ | ● | P0 |
| 31 | Radar quartier daté (D3 : projets, risques, services) | · | · | · | ◐ | · | · | · | ◐ | · | · | · | · | · | · | · | P1 |
| 32 | Simulation d'objections vendeur (D4) | · | · | · | · | · | · | · | · | · | · | · | · | · | · | · | P2 |
| 33 | Découverte terrain structurée et progressive (D5) | · | · | · | · | · | · | · | · | · | · | · | · | · | · | · | P0 |
| 34 | Briefing quotidien / next best action expliquée | · | · | · | ◐ | · | ◐ | · | · | · | · | ● | ◐ | · | · | ◐ | P0 |
| 35 | Signaux de vendeurs probables | · | · | · | · | · | · | · | ◐ | · | · | ● | · | · | · | ● | P1 |
| 36 | Agent IA 24/7 de qualification (texte / WhatsApp) | · | · | ● | ◐ | · | · | ● | · | · | · | ● | · | ◐ | · | ● | P1 |
| 37 | Agent vocal IA (appels entrants/sortants) | · | · | ● | · | · | · | · | · | · | · | · | · | · | · | · | P2 |
| 38 | Relance automatique des prospects dormants | ◐ | · | ● | ◐ | · | · | · | · | · | · | ● | ◐ | ● | · | ◐ | P1 |
| 39 | Requalification acquéreurs par chatbot | · | · | ◐ | · | ● | · | · | · | · | · | ◐ | · | · | · | · | P2 |
| 40 | Scoring de leads IA | · | · | · | · | · | ◐ | · | · | · | · | ● | ● | ● | ◐ | ◐ | P1 |
| | **D. Automatisation et orchestration** | | | | | | | | | | | | | | | | |
| 41 | Séquences multicanal | ● | ● | ◐ | ● | ● | ● | · | · | · | · | ● | ● | ● | ◐ | ◐ | P0 |
| 42 | Constructeur de workflows sans code | · | ◐ | · | · | · | · | · | · | · | · | ◐ | ● | · | · | · | P1 |
| 43 | File de validation humaine des actions IA | · | · | · | · | · | · | · | · | · | · | ◐ | · | · | · | · | P0 |
| 44 | Agents personnalisés / bibliothèque de skills | · | · | · | · | · | · | · | · | · | · | ● | · | · | · | ◐ | P2 |
| 45 | API ouverte / serveur MCP | · | ◐ | · | · | ● | ● | ◐ | ● | · | · | ● | ● | ● | · | · | P1 |
| 46 | WhatsApp intégré | ● | ● | ● | · | · | · | ● | · | · | · | · | · | · | · | ◐ | P0 |
| 47 | Téléphonie / résumé d'appel | · | ◐ | ● | · | · | · | · | · | · | · | ◐ | ● | · | · | · | P2 |
| | **E. Réseau et pilotage** | | | | | | | | | | | | | | | | |
| 48 | Console multi-agences hiérarchique | ◐ | ◐ | ● | ● | ● | ● | ◐ | · | · | · | ● | ● | ● | ● | ◐ | P0 |
| 49 | Modèles de marque hérités / verrouillés | · | · | ◐ | · | · | ◐ | · | · | ◐ | ◐ | · | · | · | ● | · | P0 |
| 50 | Reporting KPI agence / réseau | ◐ | · | ● | ● | ● | ● | ◐ | · | · | · | ● | ● | ● | · | ● | P0 |
| 51 | Distribution de leads / territoires | · | · | · | · | ● | · | · | · | · | · | ● | ● | ● | · | · | P1 |
| 52 | Rôles et permissions fines | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | · | · | · | · | ● | ● | ● | ◐ | ◐ | P0 |
| 53 | Analytics recrutement / rétention des agents | · | · | · | · | · | · | · | · | · | · | · | · | ● | · | · | P2 |
| 54 | Formation intégrée | ● | · | · | ● | · | · | · | · | · | · | · | · | · | · | · | P2 |
| | **F. Conformité et confiance** | | | | | | | | | | | | | | | | |
| 55 | Registre de consentement de prospection (loi 2025-594) | · | · | · | · | · | · | · | · | · | · | · | · | · | · | · | P0 |
| 56 | Contrôle automatique des mentions d'annonce (DPE, honoraires TTC %, F/G) | ◐ | ◐ | ◐ | ◐ | ◐ | · | · | · | · | · | · | · | · | · | · | P0 |
| 57 | Marquage IA art. 50 (images/vidéos générées) | · | · | · | · | · | · | · | · | · | · | · | · | · | · | · | P0 |
| 58 | Source traçable de chaque chiffre / citation | · | · | · | · | · | · | · | ◐ | · | · | · | · | · | · | ◐ | P0 |
| 59 | Registre LCB-FT | · | · | · | ● | · | · | · | · | · | · | · | · | · | · | · | P1 (intégration) |
| 60 | Hébergement France / IA souveraine | · | · | · | ◐ | ● | · | · | · | · | · | · | · | · | · | · | P1 |
| 61 | Facturation électronique | ● | · | · | · | · | · | · | · | · | · | · | · | ◐ | · | · | P2 (intégration) |

**Lecture.** Les lignes 18, 22, 25, 32, 33, 55 et 57 n'ont aucune couverture publique documentée ; 17, 21 et 29 n'ont que des couvertures partielles. Ce sont exactement les livrables et garde-fous du parcours vendeur NXT. À l'inverse, les lignes 2, 11, 13, 23, 24, 41 et 48 sont des standards : NXT doit les égaler ou les obtenir par intégration, sans en faire un argument. Rappel : ◐ sur la ligne 56 signifie que les champs DPE/honoraires existent dans les exports portails ; un **contrôle bloquant** n'est documenté nulle part.

## 5. Tendances 2025–2026

### 5.1 Produit et technologie

| Tendance | Preuves | Conséquence NXT |
|---|---|---|
| **Du copilote à l'agent proactif** | Lofty Cowork (07/2026) ; Compass AI Assistant (07/2026) ; Septeo agentique 2026 ; efficity Lya + revue quotidienne ; Reapit RAI AppMarket ; Alto skills | Le briefing matinal expliqué + exécution validée est la nouvelle norme d'UX. NXT doit l'avoir dès le pilote, centré vendeur. |
| **Voix partout, mais banalisée** | Hektor Voice, MIA (Septeo, gratuit), Scout (Orisha), Adapt, Cloze Maia, RAI Copilot | La dictée ne vend plus ; la valeur est ce qui en sort (fiche structurée, livrables, tâches). |
| **Agents vocaux sortants/entrants** | Ylopo AI Voice, Structurely (0,07 $/min), Scout Lead by Joe AI | En France, le sortant à froid est désormais interdit sans consentement (§ 5.2) : réserver la voix à l'entrant, aux rappels consentis et à la qualification. |
| **MCP et ouverture aux assistants** | Lofty MCP Server, BoldTrail BackOffice MCP (08/2026), Cloze Maia (MCP), Yanport (page MCP) | Exposer un serveur MCP NXT (lecture dossier, création de tâche, génération de livrable sous contrôle). |
| **Recherche via assistants IA (GEO)** | Zillow dans ChatGPT (06/10/2025) ; leboncoin dans ChatGPT (02/2026) ; SeLoger recherche vocale (09/2026) ; Orpi × Kleio (06/2026) ; Placester llms.txt | Pages bien/agence structurées, llms.txt, données locales citables : un livrable « visibilité IA » par agence. |
| **Visuels IA banalisés** | Staging 0,3–1 $/image ; Danim 2 dès 49 € HT ; Nodalview, Smartpix, Scout Image, Apimo AI+ | Inclure ; différencier par la conformité (étiquette, original, journal) et l'enchaînement dans le parcours. |
| **Consolidation / bundles** | LBI + HOQI ; Nodalview + ProperShot + Cocoon ; Septeo + Cadastre.com ; Compass + Anywhere ; fermeture LionDesk | Se positionner en **couche neutre** interopérable (Hektor, Modelo, Apimo, Ubiflow) ; promettre export complet. |
| **Prix de l'IA : de l'add-on au résultat** | Sierra AI +199 $, Real Geeks +49 $ ; HubSpot 0,50–1 $ par résultat ; Structurely à la minute ; Septeo MIA gratuit | IA incluse dans l'abonnement ; facturer les volumes lourds par **dossier vendeur validé**, pas par jeton. |
| **Seller signals / likely-to-sell** | Compass Likely to Sell, Lofty Homeowner Agent, Alto Prospecting, Revaluate, Offrs, PriceHubble SIGNAL | En France : signaux licites et explicables (DVF voisinage, DPE reclassés, durée de détention, anniversaires d'achat dans le CRM avec consentement). |

### 5.2 Réglementation et conformité (France / UE)

| Règle | Statut au 11/10/2026 | Impact produit NXT |
|---|---|---|
| **Démarchage téléphonique opt-in** — loi n° 2025-594 du 30/06/2025, décret n° 2026-662 du 23/07/2026 | **En vigueur depuis le 11/08/2026**. Consentement préalable libre, spécifique, univoque, révocable (y compris oralement), valable 1 an maximum, sans reconduction tacite ; preuve conservée 3 ans ; Bloctel supprimé. Créneaux : lun.–ven. 10–13 h et 14–20 h ; 4 appels maximum par 30 jours. Un numéro publié dans une annonce **ne vaut pas** consentement. Un mandat obtenu par appel non conforme expose la commission. Sources : [DGCCRF](https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/demarchage-telephonique-professionnels-mettez-vous-en-conformite-avec-la-reglementation), [MySweetImmo — décret pige](https://www.mysweetimmo.com/2026/08/05/agents-immobiliers-le-decret-sur-la-pige-telephonique-fixe-les-regles-applicables-des-le-11-aout/) | Registre de consentement par contact (canal, finalité, professionnel, date, expiration, preuve) ; blocage des appels hors créneaux ou sans consentement ; compteur 4/30 j ; retrait en un geste. **Bascule vers courrier, contenu et inbound = valeur directe de L3/L4.** Montant des sanctions : sources divergentes, à confirmer juridiquement. |
| **Prospection postale** | Généralement fondée sur l'intérêt légitime avec information et droit d'opposition (analyse tierce, [donneespersonnelles.fr](https://donneespersonnelles.fr/rgpd-immobilier)) ; la réutilisation de DVF/cadastre reste soumise au RGPD (finalité, attentes raisonnables). La cession de fichiers clients entre agences sans consentement a été jugée illicite (CA Orléans, 11/03/2021). | Lettres L4 : mention de l'émetteur, origine des données, lien/QR d'opposition, liste d'exclusion réseau, aucun nom de propriétaire tiré de sources non licites ; adresser « Aux occupants » par défaut. Validation juridique à obtenir avant généralisation. |
| **AI Act art. 50** (règlement UE 2024/1689) | **Applicable depuis le 02/08/2026.** Art. 50(4) : le **déployeur** signale les contenus « deepfake » (image réaliste d'un lieu existant manipulée) de façon perceptible ; art. 50(2) : marquage machine-lisible par les fournisseurs (délai jusqu'au 02/12/2026 pour les systèmes déjà sur le marché) ; art. 50(1) : informer qu'on dialogue avec une IA. Amendes jusqu'à 15 M€ ou 3 % du CA. Lignes directrices non contraignantes. Sources : [artificialintelligenceact.eu](https://artificialintelligenceact.eu/transparency-rules-article-50/), [McCann FitzGerald](https://www.mccannfitzgerald.com/knowledge/data-privacy-and-cyber-risk/ai-transparency-european-commissions-guidelines-on-article-50-part-2-deployer-obligations), [Leto](https://www.leto.legal/news/ai-act-article-50-lignes-directrices-transparence-2026) | Étiquette visible « Image virtuelle — meublée par IA » incrustée, métadonnées C2PA/IPTC, original conservé et accessible, journal de génération ; mention « assistant IA » sur tout chatbot/agent vocal ; NXT est **fournisseur** (marquage) et outille l'agence **déployeur** (mention). |
| **Photos retouchées** | Pas de texte spécifique immobilier ; une réponse ministérielle (07/2026) qualifie de trompeuse la retouche qui modifie les caractéristiques essentielles (surface, état, environnement) ; retouches techniques tolérées ([question AN](https://questions.assemblee-nationale.fr/dyn/17/questions/QANR5L17QE13930.pdf)). SeLoger exige le signalement des photos virtuelles. | Règles interdites dans le moteur de staging : supprimer fissures, vis-à-vis, équipements ; changer volumes, vues, matériaux permanents sans mention. |
| **Annonces (ALUR, DPE)** | Honoraires TTC en % du prix si à la charge de l'acquéreur ([FNAIM](https://www.fnaim.fr/communiquepresse/1546/10-la-fnaim-presente-les-annonces-a-rallonge-de-la-loi-alur.htm)) ; classes énergie/climat depuis 07/2021 ; mention spécifique F/G depuis 01/2022 ; locations : arrêté du 21/04/2022 ; encadrement des loyers. | Contrôleur bloquant avant export et sur tous les livrables (kit social, lettre, book) : un post qui cite un prix doit porter les mentions obligatoires. |
| **DPE 2026** | Coefficient électricité 2,3 → 1,9 au **01/01/2026** ; ~850 000 logements F/G peuvent gagner 1–2 classes sans travaux ; interdictions de location inchangées (G depuis 2025, F en 2028) ([MySweetImmo](https://www.mysweetimmo.com/2025/08/26/dpe-immobilier-2026-la-reforme-en-faveur-de-lelectricite-est-publiee-au-journal-officiel/), [Bailfacile](https://www.bailfacile.fr/actualites/nouvelle-formule-du-dpe-sapplique-des-le-1-janvier-2026)) | Déclencheur de prospection licite et utile : « votre DPE a peut-être changé » ; simulation de reclassement dans L6/L7 et L9 avec source ADEME. |
| **DVF** | Mise à jour semestrielle (avril, octobre), remplacement complet ; dernière publication 04/2026, couverture 2021–2025 ([data.gouv.fr](https://www.data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres/)) | Afficher le millésime et le décalage des données dans chaque analyse ; recalcul planifié à chaque publication. |
| **Facturation électronique** | Réception obligatoire pour toutes les entreprises au **01/09/2026** ; émission GE/ETI 09/2026, PME/micro 09/2027 ([Cegid](https://www.cegid.com/fr/facturation-electronique/facture-electronique-obligatoire/calendrier-facture-electronique/)) | Hors cœur : intégrer une plateforme agréée pour les factures d'honoraires (P2). |
| **WhatsApp Business** | Tarification par message depuis 07/2025 ; tarif selon le pays du destinataire ; France parmi les plus chers (~0,086 $/message marketing, calculateur tiers 04/2026) ([Meta](https://developers.facebook.com/docs/whatsapp/pricing)) | L2 (WhatsApp interne) et relances : privilégier fenêtres de service gratuites, comptabiliser le coût par dossier. |
| **RGPD général** | Conservation prospects ~3 ans après dernier contact (pratique CNIL citée par tiers) | Purge et anonymisation automatiques ; registre des traitements par agence ; DPA réseau. |

### 5.3 Marché

- Transactions dans l'ancien : 940 000 en 2025 (+11 %), 900–950 k attendues en 2026 (chiffres relayés par la presse ; voir [FNAIM, point marché 01/2026](https://www.galivel.com/media/files/point_marche_avant_premiere_fnaim___conference_de_presse_janvier_2026.pdf) et [RENT 2025](https://www.mysweetimmo.com/2025/11/04/rent-2025-rebond-du-marche-immobilier-qui-en-profite-le-plus/), à confirmer sur source primaire).
- Réseaux de mandataires : ~28 % du marché intermédié en 2025 (26 % en 2024, 13 % en 2018) ; 179 000 transactions (+22 %) ([MySweetImmo 04/2026](https://www.mysweetimmo.com/2026/04/21/immobilier-les-mandataires-confirment-leur-progression-en-2025/)). Les chiffres varient selon les périmètres (Xerfi : 15–20 % du total).
- Intermédiaires présents dans ~4 transactions sur 5 ; 28 % des acquéreurs ont utilisé un outil IA (Xerfi via [Monimmeuble](https://monimmeuble.com/actualite/ia-immobilier-80-des-ventes-passent-encore-par-un-agent-immobilier)).
- Côté éditeurs : Orisha affirme que 65 % des agents utilisent l'IA quotidiennement (tribune 12/2025, déclaratif). Le chiffre « 97 % » attribué à leboncoin n'a pas pu être vérifié.

## 6. Modèles de prix observés et recommandation NXT

### 6.1 Points de prix publics (11/10/2026)

| Catégorie | Repères |
|---|---|
| CRM transaction FR | Hektor dès 79 € HT/mois ; Apimo 89 / 139 €/mois ; Netty historique 69 €/mois ; Realty 99 € HT/5 utilisateurs ; ordre de grandeur tiers 45–130 €/utilisateur/mois + mise en place 1 500–5 000 € (Kolonell, intéressé) |
| Briques spécialisées FR | Yanport 39 € HT/utilisateur ; Danim 49–89 € HT ; Nodalview dès 79 € + crédits ; Ubiflow 55–135 € HT/point de vente (+ social 59–89 €) ; Leedflow dès 89 € HT ; Startloc 290 €/an |
| Néo-agence | Liberkeys 6 500 € au succès |
| US CRM | FUB 69 $/utilisateur ; Wise Agent 49 $ ; Real Geeks 399 $ + 500 $ ; Sierra 299–599 $ (12 mois) |
| IA en add-on / usage | Real Geeks AI 49 $ ; Sierra AI 199 $ ; Structurely voix 0,07 $/min ; HubSpot 0,50–1 $ par résultat ; Salesforce ~2 $/conversation |
| Visuels | Staging 0,26–1,6 $/image (VirtualStagingAI, Collov) ; Apply Design 7–10 $/image |

**Coût de la pile actuelle d'une agence de 5 conseillers** (prix publics, hors options) : Hektor 79 + Yanport 5 × 39 = 195 + Danim 5 × 49 = 245 + Nodalview 79 + Leedflow 89 ≈ **687 € HT/mois**, sans parcours vendeur unifié, ni console réseau, ni contrôle de conformité. C'est l'ancrage de valeur.

### 6.2 Recommandation (hypothèses à tester au pilote)

Principes : IA **incluse** (jamais une « taxe IA ») ; volumes lourds facturés **au dossier vendeur validé** (aligné sur le résultat, comme HubSpot) ; mode **surcouche** moins cher pour coexister avec le CRM existant ; prix connu avant toute génération lourde ; crédits restitués en cas d'échec technique.

| Offre | Cible | Prix proposé (HT) | Inclus |
|---|---|---|---|
| **Surcouche Vendeur** | Agence gardant Hektor/Modelo/Apimo | 49 €/siège/mois (min. 2) | D1–D5, L1–L8, 8 dossiers vendeurs/siège/mois, synchro CRM, staging 40 images/siège |
| **Agence** | Indépendants 2–10 conseillers | 249 €/agence/mois avec 5 sièges, puis 39 €/siège | Tout Surcouche + CRM NXT, portail propriétaire, kit social, lettres L4 (hors affranchissement), L9, registre de consentement, 40 dossiers/mois |
| **Réseau** | Réseaux, franchises, multi-sites | socle 990 €/mois + 149 €/agence/mois (dégressif) | Console réseau, modèles de marque verrouillés, reporting cohortes, SSO, API/MCP, DPA, accompagnement |
| **Dossier supplémentaire** | Toutes offres | 9 € par dossier vendeur validé au-delà du forfait | — |
| **Options à l'usage** | — | affranchissement L4 au coût + marge ≤ 15 % ; agent vocal entrant au coût minute + marge ; vidéo IA en pack | — |
| **Pilote Antibes** | 3–5 agences | 60 jours gratuits puis −50 % 6 mois contre données d'usage et témoignage | Mesure avant/après définie au § 10 du benchmark v1 |

Justification : à 249 € pour 5 sièges, NXT coûte ~36 % de la pile de briques (687 €) tout en ajoutant ce qu'elle n'a pas ; la Surcouche à 49 €/siège se place au niveau d'un module (Yanport + Danim ≈ 88 €/siège) et évite la migration, premier frein des réseaux. Coût variable à surveiller : modèles IA, images, WhatsApp (tarif France élevé), affranchissement. Indicateur de pilotage : **marge par dossier validé**.

## 7. Thèse de différenciation

> **NXT est l'agent IA du mandat vendeur : il prépare chaque rendez-vous, produit dans l'heure tous les livrables qui font signer et vendre, et prouve leur conformité, dans chaque agence du réseau, au-dessus du CRM existant.**

1. **Le parcours vendeur, pas le lead.** Les agents proactifs du marché (Scout Lead, Lofty Sales Agent, Ylopo, Ubiflow WhatsApp, Alto Lead Flow) traitent l'acquisition et l'acheteur. Personne ne vend D1→L9 à partir d'un dossier unique ; Reapit avait annoncé un « Listing Concierge » qui n'apparaît plus en 2026, efficity et Compass l'ont en interne seulement.
2. **Proactif et explicable.** Comme Lofty Cowork et Compass AI Assistant : chaque matin, quoi faire, pourquoi, livrable prêt, validation en un geste — mais vendu aux indépendants et réseaux français, et centré mandat.
3. **Conformité comme fonctionnalité.** Depuis août 2026, la pige téléphonique à froid est interdite sans consentement et le staging IA doit être signalé. NXT intègre registre de consentement, mentions ALUR/DPE bloquantes, étiquette art. 50, sources datées. Aucun concurrent ne documente ces trois garde-fous ensemble.
4. **Le canal qui remplace le téléphone.** Lettres voisinage déclenchées par les événements (nouveau mandat, vendu, DPE reclassé, DVF publié), kit social par jalon, book de services : NXT outille l'acquisition **licite** au moment où elle devient la principale.
5. **Gouvernance réseau.** Modèles hérités et verrouillés, autonomie locale tracée, cohortes, file de validation : la qualité homogène « même exigence dans chaque agence » (promesse v1).
6. **Neutre et interopérable.** Surcouche au-dessus de Hektor / Modelo / Apimo / Ubiflow, API et MCP, export complet — contre les bundles fermés qui se consolident.
7. **Vérifiable.** Chaque chiffre de l'analyse de valeur renvoie à sa source et son millésime ; chaque image virtuelle garde son original. La confiance du vendeur devient argument commercial.

**Ce qui ne différencie pas** (à égaler sans en parler) : dictée vocale, rédaction d'annonce, staging, matching, multidiffusion, app mobile, estimation DVF.

**Menaces à surveiller** : Septeo au RENT 2026 (agentique + 130 000 utilisateurs + KW) ; Orisha (Scout Lead étendu au vendeur) ; La Boîte Immo (HOQI + base de 45 000) ; Danim/Nodalview remontant vers le CRM ; un grand réseau construisant en interne (efficity, iad, Orpi × Kleio).

## 8. Top 10 des concurrents pour NXT

| Rang | Acteur | Pourquoi |
|---|---|---|
| 1 | **Septeo — Modelo (MIA)** | Feuille de route agentique 2026 explicite, MIA gratuit, chaîne jusqu'au notaire, KW France, données Cadastre/Insight |
| 2 | **Orisha — Immofacile (Scout, Scout Lead)** | Plus grande base installée, agent 24/7 déjà vendu, rapports vendeurs automatiques |
| 3 | **La Boîte Immo — Hektor** | 45 000 utilisateurs, Voice, staging HOQI, WhatsApp, prix d'entrée bas |
| 4 | **Apimo** | Concurrent local du pilote (Riviera, luxe, multilingue), offres AI lisibles |
| 5 | **Lofty (Cowork)** | Référence mondiale de l'agent proactif + MCP ; modèle d'UX à égaler |
| 6 | **Compass AI Assistant** | Briefing quotidien + vendeurs probables ; captif mais fixe l'attente |
| 7 | **efficity (Lya)** | Concept le plus proche en France ; preuve qu'un réseau peut construire en interne |
| 8 | **Danim 2** | Kit social + vidéo + staging à 49–89 € ; rival direct de L3/L8 |
| 9 | **Rechat (Lucy)** | Livrables marketing de marque générés par IA (social, CMA, sites) |
| 10 | **Alto Intelligence** | Appraisal builder à comparables classés, packaging en skills, prospection |

Suivants : Reapit (RAI), Adapt Immo, Whise, Ubiflow, Yanport, Nodalview, Follow Up Boss, Ylopo.

## 9. Les 100 fonctionnalités que NXT doit posséder

Étiquettes : **[=]** parité (offert par des concurrents, à égaler) · **[+]** différenciant (absent ou rare publiquement) · **[§]** conformité. Entre parenthèses : qui l'offre ou s'en approche.

### A. Préparation du rendez-vous vendeur (D1–D5) — 10
1. [+] Brief relationnel pré-RDV sourcé : historique, interactions, objectifs, homonymes signalés (FUB Smart Summaries, partiel).
2. [=] Étude de comparables vendus DVF + en vente, prix vendu/affiché séparés, millésime affiché (Yanport, Alto, ImmoScope).
3. [+] Fourchette de valeur avec incertitude et limites expliquées, jamais un prix unique non justifié.
4. [+] Radar quartier daté : projets, permis, travaux, risques (Géorisques/ERP), services, avec statut annonce/autorisé/livré.
5. [+] Simulation reclassement DPE 2026 (coefficient 1,9) à partir du DPE existant et des données ADEME.
6. [+] Préparation d'objections vendeur et argumentaire personnalisé (coaching facultatif).
7. [+] Check-list de RDV conditionnelle (indivision, SCI, succession, co-vendeurs, copro, viager).
8. [+] Découverte terrain progressive : dictée ou formulaire court, photos, validation champ par champ (efficity Lya, interne).
9. [=] Import automatique des données du bien : cadastre, copro, DPE, taxe foncière (Hektor, Modelo/Cadastre.com).
10. [+] Pack « RDV prêt » envoyé la veille à l'agent avec ce qui manque encore.

### B. Livrables post-rendez-vous (L1–L9) — 14
11. [+] L1 Email de remerciement personnalisé, relu et envoyé en un geste, dans l'heure.
12. [+] L2 Brief interne WhatsApp/Slack à l'équipe (bien, points sensibles, prochaines étapes).
13. [=] L3 Kit réseaux sociaux par bien : formats Instagram/Facebook/LinkedIn/stories, légendes (Danim, Ubiflow, Rechat, Lofty).
14. [+] L3 Kit déclenché par jalon du mandat : nouveau mandat, baisse de prix, visite ouverte, compromis, vendu.
15. [+] L4 Lettres de prospection voisinage générées, adressées « Aux occupants », conformes RGPD, avec QR d'opposition.
16. [+] L4 Routage postal intégré (impression, affranchissement, suivi de campagne, coût affiché avant envoi).
17. [+] L5 Book de services de l'agence personnalisé par vendeur (méthode, preuves, références locales).
18. [=] L6–L7 Analyse de valeur rédigée, lisible par le vendeur, chaque chiffre sourcé (Alto appraisal builder, Rechat CMA).
19. [+] L7 Trace des désaccords vendeur/agent sur le prix et révisions motivées.
20. [=] L8 Home staging virtuel multi-styles (Smartpix, Scout Image, Apimo AI+, Nodalview, Danim).
21. [+] L8 Curseur avant/après, étiquette « image virtuelle » incrustée, original conservé et lié.
22. [+] L9 Dossier copropriété : pièces requises conditionnelles, extraction PV/DPE avec citation de page, validité, relances.
23. [=] Rédaction d'annonce + variantes portails + traduction (EN, IT, DE, RU pour la Riviera) (Hektor, Apimo, Scout).
24. [+] Contrôle de cohérence entre tous les livrables (surface, prix, DPE, honoraires identiques partout).

### C. Proactivité et agents IA — 12
25. [=] Briefing quotidien priorisé, avec le « pourquoi » de chaque action (Lofty Cowork, Compass, efficity).
26. [=] Exécution en un geste après validation (Lofty Cowork).
27. [+] File de validation humaine unique pour tout ce que l'IA propose (approuver / modifier / rejeter) (Luxury Presence, partiel).
28. [+] Détection d'oubli : RDV sans suivi, mandat sans rapport, compromis sans pièce, expiration de mandat proche.
29. [=] Relance automatique des prospects dormants, respectant le consentement (Scout Lead, Lofty, BoldTrail).
30. [=] Agent 24/7 de qualification entrante (site, portails, WhatsApp) avec reprise humaine explicite (Scout Lead, Ubiflow, CINC).
31. [+] Signaux vendeurs licites et expliqués : ventes DVF voisines, DPE reclassé, durée de détention, anniversaire d'achat CRM.
32. [=] Requalification périodique des acquéreurs (Adapt chatbot).
33. [=] Scoring des leads explicable (FUB, Lofty, BoldTrail).
34. [+] Rapport vendeur hebdomadaire automatique (visites, retours, statistiques portails, recommandations) (Immofacile, Street, partiel).
35. [=] Résumé d'appel → fiche contact et tâche (Leedflow, FUB).
36. [+] Mode « absence » : l'agent remplaçant reçoit un dossier lisible et les tâches réaffectées.

### D. CRM et transaction — 14
37. [=] Fiches bien, mandats, registre des mandats électronique.
38. [=] Contacts vendeurs/acquéreurs, historique unifié multicanal.
39. [=] Rapprochement acquéreurs ↔ biens avec explication du score.
40. [=] Agenda, visites, bons de visite, confirmations et rappels SMS/email.
41. [=] Portail propriétaire temps réel (Apimo, Modelo, Whise, Liberkeys).
42. [=] Signature électronique des mandats et bons de visite (intégration Yousign/Docusign/Immosign).
43. [=] Pipeline mandat → offre → compromis → acte avec échéancier partagé.
44. [=] Application mobile terrain rapide, hors connexion partiel.
45. [=] Diffusion multi-portails par intégration (Ubiflow, CRM existants).
46. [=] Partage de mandats inter-agences avec aperçu de ce qui est exposé (Interkab, Apimarket, Inter'Adapt).
47. [+] Gestion des cas difficiles : indivision, SCI, multiples mandats, changement d'agence, retrait de consentement.
48. [=] Pièces et documents versionnés avec empreinte et responsable.
49. [=] Import/migration depuis Hektor, Modelo, Apimo, Adapt (CSV + API).
50. [+] Mode surcouche : synchronisation bidirectionnelle avec le CRM existant sans double saisie.

### E. Prospection et acquisition — 10
51. [+] Carte de prospection des zones (DVF, mandats, ventes de l'agence) sans exclusivité payante.
52. [+] Campagnes voisinage déclenchées par événement (nouveau mandat, vendu, DPE, publication DVF).
53. [§] Prospection téléphonique limitée aux contacts consentants, dans les créneaux légaux, compteur 4/30 jours.
54. [=] Pages d'estimation en ligne et capture de leads vendeurs (Lofty, Real Geeks, Meilleurs Agents).
55. [+] Audit d'onboarding « ventes manquées dans votre fichier » (DVF × CRM) (Revaluate, en version US).
56. [=] Recommandation et parrainage : demande d'avis et de recommandation après vente, consentie.
57. [=] Gestion des avis Google avec réponses IA (Ubiflow).
58. [+] Visibilité IA de l'agence (GEO) : pages structurées, llms.txt, fiches citables par ChatGPT/Claude (Orpi × Kleio, Placester).
59. [=] Pubs sociales générées depuis un bien avec reporting vendeur (Rex Reach, Lofty Blast).
60. [+] Attribution des leads et zones par territoire réseau, sans revente de fichiers (Offrs, BoldTrail, version licite).

### F. Marketing et diffusion — 8
61. [=] Vidéo courte automatique depuis photos et annonce (Danim, Nodalview).
62. [=] Retouche photo IA : lumière, redressement, ciel, effacement d'objets non structurels (Nodalview, Smartpix).
63. [=] Planification de posts multi-réseaux (Danim, Ubiflow).
64. [+] Bibliothèque de marque réseau : gabarits verrouillés, zones éditables locales (Rechat Studio, partiel).
65. [=] Mini-site par bien / Smart Link (Adapt, Nodalview, Rechat).
66. [+] Supports imprimables (vitrine, flyer, book) générés depuis le même dossier.
67. [=] Newsletter vendeurs/acquéreurs segmentée (Whise, Lofty).
68. [+] Mesure par livrable : ouvertures, visites générées, mandats attribués (sans attribution abusive).

### G. Réseau et gouvernance — 10
69. [=] Console multi-agences hiérarchique (réseau → région → agence → équipe).
70. [=] Rôles et permissions par action et par périmètre.
71. [+] Héritage des méthodes réseau avec exceptions locales tracées.
72. [+] Cloisonnement prouvé entre agences et franchisés (aucune fuite non autorisée).
73. [=] Distribution de leads par secteur, disponibilité et capacité (Adapt, FUB, BoldTrail).
74. [+] Intérim et remplacement daté de responsabilité d'agence.
75. [+] Déploiement par vagues avec comparaison d'agences pilotes et témoins.
76. [=] SSO et gestion centralisée des comptes.
77. [+] Sortie d'un franchisé : export de sa clientèle et révocation sans perte pour le réseau.
78. [=] Formation intégrée et guides contextuels (Hektor Akadémie, Modelo Académie).

### H. Pilotage et analytics — 7
79. [=] Tableaux de bord agence/réseau (mandats, ventes, délais, CA).
80. [+] Délai RDV → suivi validé, médian et p90, par agence.
81. [+] Qualité IA : taux de livrables modifiés, rejetés, erreurs factuelles signalées.
82. [+] Coût par dossier vendeur validé (IA, images, messages, courrier).
83. [=] Revues d'agence périodiques avec chiffres expliqués et tâches (Reapit, Street, Whise Analytics).
84. [+] Adoption hebdomadaire par cohorte et par fonctionnalité.
85. [=] Indicateurs de risque : mandats proches d'expiration, ventes en danger (Alto IQ).

### I. Conformité et confiance — 10
86. [§] Registre de consentement par contact et par canal (preuve 3 ans, expiration 1 an, retrait oral).
87. [§] Contrôle bloquant des mentions d'annonce (honoraires TTC %, classes DPE/GES, mention F/G, encadrement loyers).
88. [§] Étiquetage AI Act art. 50 des images/vidéos générées + métadonnées machine-lisibles.
89. [§] Mention « vous échangez avec un assistant IA » sur tout agent conversationnel ou vocal.
90. [§] Règles anti-tromperie sur les visuels (pas de suppression de défauts, de vis-à-vis, de changement de volume).
91. [§] Provenance de chaque fait : source, date, version, responsable de la validation.
92. [§] Liste d'opposition réseau partagée (courrier, email, téléphone) appliquée à toutes les agences.
93. [§] Durées de conservation et purge automatique ; export et suppression sur demande (RGPD).
94. [§] Registre LCB-FT et vigilance (intégration Modelo Legal ou équivalent).
95. [§] Hébergement UE/France, DPA, sous-traitants IA déclarés, pas d'entraînement sur les données clients.

### J. Plateforme, intégrations et UX — 5
96. [=] API ouverte documentée et webhooks (Adapt Connect, Whise, FUB).
97. [=] Serveur MCP pour assistants IA (Lofty, BoldTrail, Cloze).
98. [=] WhatsApp Business intégré avec suivi du coût par message (Hektor, Apimo, Ubiflow).
99. [+] Reprise après panne : aucun job perdu ni doublon, centre d'incidents visible.
100. [+] Estimation du coût et du délai affichée avant toute génération lourde (staging, vidéo, campagne courrier).

## 10. Limites et prochaines vérifications

- Aucune démo ni compte testé : la matrice compare des **déclarations publiques**. Prévoir une démo standardisée (jeu de dossiers synthétiques du benchmark v1) avec Septeo, Orisha, Hektor et Apimo avant toute allégation de supériorité.
- Prix des suites françaises (Modelo, Immofacile, Adapt, Whise) non publics ; ceux d'Apimo sans unité ni HT/TTC.
- Plusieurs annonces 2026 reposent sur des communiqués ou contenus sponsorisés (efficity, Lofty, Kleio) ; résultats chiffrés non vérifiés.
- Points juridiques à faire valider : montant des sanctions démarchage, base légale exacte des lettres voisinage alimentées par DVF/cadastre, qualification « deepfake » du staging (lignes directrices art. 50 non contraignantes).
- Chiffres de marché (940 000 transactions, part des mandataires) relayés par la presse spécialisée ; à confirmer sur les sources primaires (notaires/IGEDD, FNAIM).
- « Imonovo » non trouvé en ligne ; Hestia, Imoxa, Kiwiz, Stello introuvables comme produits immobiliers IA.

## 11. Sources complémentaires (non citées plus haut)

- Agents IA immobiliers 2026, prix : [Rework](https://resources.rework.com/tools/ai-agents/best-ai-agents-for-real-estate-2026) ; [Callingly — ISA](https://callingly.com/blog/real-estate-isa-guide).
- Portails : [Zillow dans ChatGPT](https://www.zillowgroup.com/news/zillow-becomes-first-real-estate-app-in-chatgpt) ; [Rightmove IA](https://hub.rightmove.co.uk/new-ai-tools-helping-you-reach-and-convert-more-movers/) ; [Idealista rédaction IA](https://onlinemarketplaces.com/articles/idealista-launches-ai-listings-description-enhancement-tool) ; [Zoopla IA](https://thenegotiator.co.uk/news/marketing-news/ai-empowered-zoopla-rolls-out-new-strategies-for-agents-and-builders/).
- Staging et transparence US : [The Close](https://theclose.com/news-ai-listing-photo-disclosure/) ; [NorthstarMLS](https://northstarmls.com/insights/guidelines-for-virtual-staging-and-ai-enhanced-listing-photos/) ; [HousingWire](https://www.housingwire.com/articles/when-listings-lie-ai-staging-pushes-real-estate-into-an-ethics-gray-zone/).
- Netty dans Septeo : [Solutions Numériques](https://www.solutions-numeriques.com/?p=87258) ; [Netty offre Modelo](https://www.mysweetimmo.com/2022/06/01/pros-de-limmo-netty-offre-labonnement-a-modelo-a-ses-utilisateurs/).
- Nestenn et IA : [Observatoire de la franchise](https://www.observatoiredelafranchise.fr/indiscretions-actualite/NESTENN-la-revolution-numerique-chez-nestenn-lia-en-soutien-des-agents-immobiliers-80573.htm).
- Prospection et RGPD : [CMS — prospection et RGPD](https://cms.law/en/fra/legal-updates/prospection-commerciale-et-rgpd-vers-un-durcissement-du-cadre-juridique) ; [Gazette du Palais — cession de fichiers](https://www.labase-lextenso.fr/gazette-du-palais/2021-n34/la-sanction-de-la-nullite-du-contrat-de-vente-de-fichiers-clients-entre-agences-immobilieres-au-regard-du-rgpd-GPL426z7).
`,sn='# NXT Agent: Visual Research Sprint 01 (Inspiration)\n\nDate: 2026-10-11. Scope: landing page plus the CRM/app for an AI-first, proactive platform for French real-estate agents and networks. Positioning: Côte d\'Azur luxury meets top-tier AI SaaS.\n\n## Method and honesty notes\n\n- **Inspected:** 55+ references in total: 16 Dribbble shots looked at in hi-res (from about 60 search results across 6 queries), 9 Behance projects, 7 Awwwards entries, 3 Land-book entries, the Lapa real-estate category, and 20 live sites (17 captured at 1440x900; 3 measured for tokens only).\n- **Measured tokens (not guessed):** on every live site I ran a script that read the computed fonts, the most-used colors, the CTA radius, the CSS easing curves and the animation libraries in use. Where this doc quotes hex values, fonts or easings for live sites, they come from that script.\n- **Pinterest:** `pinterest.com/search/pins/?q=...` rendered an empty `<body>` (no pins, no text; it looks like a login or bot wall). I used nothing from Pinterest.\n- **Godly** (`godly.website`) now redirects to `recent.design`. The search came back with no site list, so I used nothing from it.\n- **SaaSframe** `/categories/crm` returned 404. For CRM patterns I used the live sites (Linear, Attio, Twenty, Folk) instead.\n- **Lapa Ninja** real-estate category: I reviewed it, but it is mostly illustrative or non-luxury (Huts, Elevate). Nothing from it made the top 30.\n- **Screenshots:** the in-app browser pane was hidden, which blocks its screenshot function. Instead:\n  - Live sites were captured with Chrome DevTools in an isolated profile.\n  - Dribbble, Behance, Awwwards and Land-book images were saved from their public CDNs.\n- **Cookie banners:** some were hidden with CSS for the captures. None were accepted.\n- **Sotheby\'s** showed a human-verification page in the DevTools browser. I did not bypass it; its tokens come from the in-app browser.\n- **Saved files:** 46 useful images are in `research/shots/`; weak and duplicate ones were deleted. Prefixes: `drb-` Dribbble, `be-` Behance, `aw-` Awwwards, `lb-` Land-book, `site-` live capture. Files starting `ms-` were written by a parallel task and are not part of this index.\n\n---\n\n## 1. Top 30 references\n\n| # | Reference | Platform | What\'s exceptional | Steal for the landing page | Steal for the CRM |\n|---|---|---|---|---|---|\n| 1 | **Loam House**: https://residences.loamhouse.com.au · `site-loamhouse.jpeg`, `aw-loam-house.jpg` | Awwwards nominee, live | Cormorant Garamond 300 at 122px with -5.5px tracking; second line in gold italic ("Bayside living"); DM Sans 300 body; dark glass lead panel over golden-hour render; 3-up stat row "88 · 86–275 m² · 3 min". Measured eases `cubic-bezier(.76,0,.24,1)` (in-out) and `(.3,1.4,.4,1)` (overshoot). GSAP + ScrollTrigger + three.js. | Serif/italic hero pairing; glass "Recevoir l\'estimation" side panel; pill CTAs with an icon disc | Big serif numerals for KPI triads; the overshoot ease for confirmations |\n| 2 | **Vestris** (AI agents for real-estate closing): `lb-vestris.webp` | Land-book | Editorial serif with an italic half and giant parentheses: "( The file *moves itself* )". Painterly olive foliage frames a real product UI. "Hours of work, *done in minutes*". A "human checkpoint" promise. Incoming documents feed with "Routed to Order #432". | Closest positioning match. Copy structure: claim, product, proof, then "try with a sample file" | Automation feed card: incoming item, AI action, routed destination, human-approve chip |\n| 3 | **Lev** (AI platform for CRE): https://www.lev.com · `site-lev.jpeg`, `aw-lev.jpg` | Awwwards, live | Full-bleed dusk skyline video; IBM Plex Sans 500 at 80px, -3.6px; near-black green `#0F1716`-ish bg; mint CTA `oklch(.874 .126 166)` (about `#6FE3B5`). Product panel shows an AI "Screen result" with skeleton shimmer rows while it reasons. | Video hero with a short two-line promise ("Do less work. Close more deals.") | AI "thinking" skeleton that resolves into fields: use it for the pre-appointment brief |\n| 4 | **Lenval Properties**: https://lenvalproperties.com · `site-lenval.jpeg`, `aw-lenval.jpg` | Awwwards, live | Financier Display (serif) + Helvetica Now; espresso `#211A19` / cream `#F9F4EE`; macro-texture video (sand, shells); live local clock "19:18 UAE"; tiny project index "P3 · Project J". Lenis + GSAP + Barba page transitions. Ease `(.25,1,.5,1)`. Awwwards thumb shows "( Refined Living )" in parentheses. | Live "Antibes 18:42" clock in the nav; macro material textures (limestone, sea) as section dividers; Barba-style transitions | Project codes (P3) as a quiet meta language for mandates |\n| 5 | **Mejuma Tuscany**: https://mejuma-tuscany.com · `aw-mejuma.jpg` | Awwwards, live | 406px "Roxale Story" wordmark over aerial video inside a rounded inset frame; Golos Text body; ink `#38352C` on `#F1F1F1`; saffron pill CTA `#FFCA4F`. Ease `(.625,.05,0,1)`. Lenis/Locomotive. | Inset rounded video frame (16px margin) with the giant wordmark | The single-saffron-accent discipline: one warm accent only |\n| 6 | **111 West 57th**: https://111w57.com · `site-111w57.jpeg` | Lapa, live | Taupe field, stacked numerals "111 / W / 57" in a light serif, bronze-grey meta `#7C7262`, ghost INQUIRE button. Expo eases `(.19,1,.22,1)` and `(.23,1,.32,1)`. | Typographic preloader: stack "N / X / T" then morph to the hero | Monochrome taupe/bronze neutral ramp for premium tables |\n| 7 | **Sobha Privy Collection**: `aw-sobha-privy.jpg` | Awwwards | "*The art* / OF THE SUBLIME": script italic over spaced caps (TT Ramillas 300); B&W portrait; a "3D Map" link in the header. Ease `(.7,0,.3,1)`. | Script-italic plus caps lockup for section openers ("*L\'art* DE LA VENTE") | "3D Map" entry point, which becomes the neighborhood radar |\n| 8 | **Aman**: https://www.aman.com · `site-aman.jpeg` | Live | Limestone page `#F3EEE7`, Lyon Display/Text, zero radius, video inset with a 25px margin, a single dark "Reserve" block. Almost no color. | Restraint benchmark: one CTA and a lot of air | Limestone surfaces and zero noise: CRM calm |\n| 9 | **Michaël Zingraf (Christie\'s, Côte d\'Azur)**: https://www.michaelzingraf.com · `site-zingraf.jpeg` | Live (local competitor) | Aerial Villefranche-sur-Mer video; red square logo `#CF282A`; ivory `#FFFDF8`; a script "Collection" nav item; **"Livie AI" chat widget already live**. | Riviera palette from the imagery: azur sea, terracotta roofs, umbrella pine, limestone | Proof that luxury agencies already run AI concierges, so ours must feel more native and proactive |\n| 10 | **Barnes**: https://www.barnes-international.com · `site-barnes.jpeg` | Live (French incumbent) | Raleway caps with 2px tracking; crimson `#C70A33`; sand `#EAE6DD`; segmented search pill over the villa hero. | Counter-reference: avoid the red, caps and search-bar codes of incumbents. Keep the warm sand. | Segmented control style (Acheter / Louer / Saisonnier) for CRM view switchers |\n| 11 | **Daniel Féau (Christie\'s)**: https://danielfeau.com · `site-feau.jpeg` | Live | Helvetica Neue Light Condensed caps; Haussmann interiors with an Eiffel view; red CTA; dense filter bar. | Counter-reference for density. Keep the photographic standard (bright, architectural). | — |\n| 12 | **Sotheby\'s International Realty** (`sothebysrealty.com`) | Live (tokens only) | Navy `#002349` / `#001731`, gold `#C29B40`; Freight Big + Benton Sans + Mercury Display Italic. | Navy plus gold as a trust code. Reinterpret it as Azur plus Champagne rather than copying it. | — |\n| 13 | **Knight Frank**: https://www.knightfrank.com · `site-knightfrank.jpeg` | Live | Tiempos Headline + Suisse Intl; illustrated editorial cover for "The Residence Report"; huge numerals "130 · 600+ · 20,000+". | Big-number social-proof band | **The valuation report as an editorial magazine cover**: a model for the deliverables |\n| 14 | **The Agency**: https://www.theagencyre.com · `site-theagency.jpeg` | Live | Playfair with an italic emphasis word ("world\'s *finest*"); red block logo; full video. | Italic emphasis word in the headline (one word only) | — |\n| 15 | **Linear**: https://linear.app · `site-linear.jpeg` | Live | `#08090A` bg; Inter Variable at weight 510, -1.4px; product UI is the hero; Berkeley Mono; pill CTAs. Ease `(.25,.46,.45,.94)`. | Product-as-hero framed in a 1px-border window with a soft glow | Sidebar IA, activity timeline ("Triage Intelligence added labels…"), keyboard-first, 1/84 record navigator |\n| 16 | **Attio**: https://attio.com · `site-attio.jpeg` | Live | Inter Display 600/64px, -1.28px; a Tiempos serif for accents; JetBrains Mono; "Ask Attio" button; workflow runs with Running/Paused/Done states; dotted canvas; Live toggle. | "Welcome to agentic revenue." Short, declarative, product right below | Automation builder on a dotted canvas plus a run-history list; "Ask NXT" global button |\n| 17 | **Twenty CRM**: https://twenty.com · `site-twenty.jpeg` | Live | Aleo Light serif mixed with bold Host Grotesk in the same line ("CRM **at AI Speed**"); notched cut-corner buttons; pixel-bar side ornament; a dense, clean table with chip cells. | Mixed serif/sans inside one headline | Record table: chip cells, avatar owners, checkbox column, "New Record" CTA |\n| 18 | **Folk**: https://www.folk.app/fr · `site-folk.jpeg` | Live (French UI) | Uxum Grotesque 72px, -1.8px; bracketed mono eyebrow "[ PRÉSENTATION … ]"; grainy grey gradient behind the product; kanban stages with totals ("Proposition envoyée 2 · 118 000 $"). | Bracketed mono eyebrows; grain-gradient stage behind the product shot | Kanban column headers with count and € total; French microcopy tone |\n| 19 | **Vercel**: https://vercel.com · `site-vercel.jpeg` | Live | Geist Sans 64px, -3.84px; `#FAFAFA`; one object with a soft drop shadow; logo marquee. | Network-logo marquee; one hero object with a contact shadow | — |\n| 20 | **Clay**: https://www.clay.com · `site-clay.jpeg` | Live | Roobert + Canela; tactile claymation 3D; ⌘K search in the marketing nav. | ⌘K shown in the landing nav as a "this is a power tool" signal | Command palette |\n| 21 | **Nixtio "Planetvision"**: dribbble.com/shots/27353125 · `drb-nixtio-luxury.webp` | Dribbble | Giant condensed caps placed partly behind the house (depth masking); blueprint plus a black spec block "Q4 2026 · 0.12 HA · 450 M²"; day/night toggle. | Text-behind-subject masking in the hero | Day/night toggle, reused as a **before/after virtual staging** switch |\n| 22 | **Phenomenon "Elyse Residence"**: dribbble.com/shots/25815603 · `drb-elyse-phenomenon.webp` | Dribbble | Didone giant "ELYSE" overlapping the photo; italic-caps eyebrow "HOLISTIC LUXURY"; numbered sections (3)(4)(5); green-black tiles; translucent vertical pillars over the interior. | Numbered section indices (01)–(09) for the 9 deliverables | — |\n| 23 | **Lumios "Cala Mira"**: dribbble.com/shots/27409474 · `drb-lumios-editorial.webp` | Dribbble | Split layout: left frosted sidebar with spec table (Interior 620 m², Completion, Architect), floor-plan level switcher, right hero photo; GPS coordinates "36°01′12″N — 5°36′18″W" in the footer; bronze monochrome. | Coordinates as ornament (Antibes 43°34′N 7°07′E) | **Property detail template**: spec table, plan switcher, gallery counter 01/06 |\n| 24 | **Serhii Yurkovskyi, minimal premium**: dribbble.com/shots/26974437 · `drb-serhii-minimal.webp` | Dribbble | An amber bar-chart **skyline mask** cut into the photo; amber monochrome type; live clock. | Signature idea: market data bars that double as a skyline mask | Market-data sparkbars in the same "cut-out" style |\n| 25 | **Minhaj "A Modern Heirloom"**: dribbble.com/shots/27718992 · `drb-minhaj-editorial.webp` | Dribbble | Geometric sans with a swashy italic serif second line; dusk gradient (navy to apricot); cascading collage of image cards. | Cascading card collage revealing the 9 deliverables | — |\n| 26 | **RonDesignLab "Onero"**: dribbble.com/shots/26761941 · `drb-onero-crm.webp` | Dribbble | A blurred 3D building as the backdrop with floating glass panels (occupancy, unpaid rent, a "Fix window handle" task); spatial, visionOS-like. | — | **Property "digital twin" view**: blurred hero photo with glass widgets for the mandate cockpit |\n| 27 | **RonDesignLab "Palco CRM"**: dribbble.com/shots/25472601 · `drb-palco-crm.webp` | Dribbble | Frosted pastel cards; hatched (diagonal-stripe) projected bars versus solid actuals; property photo card with timestamp; dashed-outline hovered table row. | — | Hatched = projected / AI forecast, solid = real. A clean, honest data language |\n| 28 | **Nixtio smart dashboard**: dribbble.com/shots/26522978 · `drb-nixtio-dashboard.webp` | Dribbble | Desaturated map with halo pins; black capsule cluster "15 · $4,954,380 · 5Y" anchored to the selected pin. | Animated map pins in the "Radar quartier" section | **Neighborhood radar**: halo pins plus a black stat capsule |\n| 29 | **Hilf "NexusAI" dark CRM**: dribbble.com/shots/27558036 · `drb-nexusai-dark.webp` | Dribbble | Right rail: "Good morning, Alex · Live", a list of proactive bullets ("7 deals require attention"), a 2x2 quick-action grid (Generate follow-up email, Create proposal…), a chat; barcode-style meters. | — | **Daily proactive brief rail**: greeting, bullet insights, one-tap actions |\n| 30 | **Behance "Agentic AI Real Estate CRM"**: behance.net/gallery/251823875 · `be-agentic-ai-crm.jpg` | Behance | The dashboard headline is a sentence: "You have 3 hot buyers ready to close"; hot-buyers list with match bars; live activity feed; aerial render as the header. | — | **Headline-as-insight** at the top of the CRM home |\n\n**Also inspected (moodboard support, not in the top 30):**\n- Brand and print mood:\n  - Behance *Lunáre* (`be-lunare.png`): chocolate leather and spaced display caps.\n  - *The Blumont* (`be-blumont.jpg`): navy card stock with gold foil on a silver tray; this is the prospect-letter and services-book print feel.\n  - *Jawhara* (`be-jawhara.jpg`): an embossed champagne monogram on `#0E2630`.\n- Real-estate SaaS UI:\n  - *Real Estate Platform UX/UI* by Nixtio (`be-re-platform.jpg`).\n  - *Propflow* (`be-propflow.png`).\n  - *Gudrix* investment (`be-re-investment.png`): a lime band chart with italic light numerals, a good model for the valuation curve.\n  - *PropValue* (`be-valuation.png`).\n- Landing references:\n  - Land-book *Chisel Industries* (`lb-chisel.webp`): thin line-diagram connectors drawn over photography with glass captions. **Ideal for explaining the AI pipeline.**\n  - *Flamingo Estate* (`lb-flamingo.webp`).\n  - Awwwards *Mr. C Residences Boca* (`aw-mrc-boca.png`): Riviera boat lifestyle.\n  - *Rialto* (`aw-rialto.jpg`).\n  - Dribbble *Eloria* (`drb-eloria-orbix.webp`): split CTA, label plus a square arrow.\n  - *Estateo* (`drb-estateo-outcrowd.webp`): segmented agent progress bars, status chips on property cards.\n  - *Arc* (`site-arc.jpeg`): cream `#FFFCEC` plus a single electric blue `#3139FB`.\n\n**Anti-patterns seen (do not do):**\n- Generic lavender/indigo dashboards (Delisas *Proptee*, Hexcode *Estatehub*).\n- Gold-baroque "luxury" (Peno Lab *Lustra*).\n- Sky-blue stock-tower templates (Olack).\n- Rainbow donut KPIs (Estateo colors).\n- Playfair plus red as a default luxury cliché.\n\n---\n\n## 2. Three design directions\n\nAll three use:\n- A 12-column grid, max content width 1320px, gutter 24px, outer margin `clamp(20px, 5vw, 80px)`.\n- A 4px spacing base: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 192.\n- CRM density at 8/12/16. Landing section rhythm at 128–192px.\n- `prefers-reduced-motion`: all transforms collapse to 150ms opacity fades.\n\n### Direction A: "Riviera Noir" (dark nocturnal luxury)\n\n**Mood:** Antibes after sunset. Cap d\'Antibes villa lit from inside, Lenval and Loam House nocturne, Lev\'s cinematic dark. Warm blacks, never blue-black. Champagne used like jewellery.\n\n**Palette**\n\n| Token | Hex | Role |\n|---|---|---|\n| `--noir` | `#0D0C0A` | page background |\n| `--graphite` | `#161512` | cards, sidebar |\n| `--smoke` | `#211F1B` | elevated, hover, inputs |\n| `--hairline` | `#F4EFE6` at 8% | borders, dividers |\n| `--ivory` | `#F4EFE6` | primary text |\n| `--stone` | `#A39B8B` | secondary text, meta |\n| `--champagne` | `#C9A96E` | accent: key CTA, active state, AI signature |\n| `--champagne-deep` | `#9C7E47` | pressed, focus ring at 40% |\n| `--azur-night` | `#6FA3B8` | links, info, AI-generated highlights |\n| `--sage` | `#86A98C` | success / signed |\n| `--ochre` | `#D6A157` | warning / follow-up due |\n| `--rouge` | `#C25A4A` | danger / lost |\n\n**Type**\n- Display: **Cormorant Garamond** 300/300-italic (Google). Fallback: `Georgia, \'Times New Roman\', serif`. Alternative: **Gambetta** (Fontshare).\n- UI: **Inter Tight** 400/500/600 (Google). Fallback: `system-ui, -apple-system, \'Segoe UI\', sans-serif`. Alternative: **Switzer** (Fontshare).\n- Data/meta: **JetBrains Mono** 400 (Google). Fallback: `ui-monospace, SFMono-Regular, Menlo, monospace`.\n- Scale: hero 112–128px, tracking -4.5%, line-height 0.92; H2 64px; H3 32px; body 16/26; UI 13–14; mono meta 11px, +6% tracking, uppercase.\n\n**Shape and depth**\n- Radius: 2px on buttons and inputs (architectural), 14px on cards, 999px only for status pills.\n- Shadows: none on dark surfaces. Depth comes from an inner 1px top highlight `inset 0 1px 0 rgba(244,239,230,.06)` plus a champagne glow on focus `0 0 0 1px #C9A96E66, 0 0 24px #C9A96E22`.\n- Glass: `rgba(22,21,18,.62)` + `backdrop-filter: blur(20px) saturate(140%)` + hairline border, used only over photography or video.\n\n**Motion**\n- Slow, cinematic, weighted.\n- Reveals: 900ms `cubic-bezier(.76,0,.24,1)` (Loam). Text line masks staggered 70ms.\n- Hover: 240ms `cubic-bezier(.25,1,.5,1)` (Lenval).\n- Page transitions: 1100ms curtain wipe with `(.7,0,.3,1)`.\n- Lenis smooth scroll, lerp 0.08.\n\n**Signature hero:** "Nocturne". A full-bleed slow dolly video of a Cap d\'Antibes villa at blue hour inside a 16px inset rounded frame.\n- Headline in Cormorant 300: "L\'immobilier d\'exception," with "*orchestré.*" in champagne italic.\n- As the user scrolls, the windows of the villa light up one by one, each window labelled with a deliverable (Brief, Radar, Estimation…).\n- Live clock "Antibes 21:14 · 43°34′N 7°07′E" bottom-left in mono.\n\n**Signature CRM:** "Salon". A graphite three-pane app (nav · list · record).\n- The home opens on a Cormorant sentence: "3 vendeurs à rappeler, 1 estimation prête à envoyer." Each phrase is a clickable chip.\n- The right rail is the "Majordome" AI brief with champagne-edged quick actions.\n- Projected data is drawn hatched, real data solid.\n\n### Direction B: "Calcaire & Azur" (light Mediterranean editorial) ★\n\n**Mood:** Antibes at 10am. Old-town limestone, Mediterranean blue, terracotta roofs, umbrella pines. Editorial like Aman and Vestris, precise like Linear and Attio. Warm paper, ink-blue AI. Feels like a printed dossier from a great agency.\n\n**Palette**\n\n| Token | Hex | Role |\n|---|---|---|\n| `--calcaire` | `#F2EDE4` | page background (limestone) |\n| `--papier` | `#FBF8F3` | cards, panels, documents |\n| `--craie` | `#E8E1D4` | sunken, hover rows, skeletons |\n| `--trait` | `#DCD3C3` | hairlines, table borders |\n| `--encre` | `#191815` | primary text |\n| `--encre-2` | `#4A463F` | secondary text |\n| `--pierre` | `#8A8274` | meta, placeholders |\n| `--azur` | `#1D4A63` | primary brand, primary CTA, AI voice, links |\n| `--azur-deep` | `#123346` | CTA hover/pressed, dark sections |\n| `--azur-mist` | `#DCE7EC` | AI-suggestion background, selected rows |\n| `--mer` | `#4C8DA8` | charts (series 1), focus ring |\n| `--terracotta` | `#B4593A` | accent: "hot" signals, highlights, the one warm spark per screen |\n| `--pin` | `#3E5641` | success / mandat signé, charts (series 2) |\n| `--ocre` | `#C4943F` | warning / relance, gold detail on print deliverables |\n| `--bordeaux` | `#8E2F2B` | danger / perdu |\n\nNight mode for the CRM "focus" theme: `--nuit #0F1315`, `--nuit-2 #161C1F`, `--nuit-3 #1F272B`, text `#EDE7DC`, meta `#8E968F`, azur becomes `#7FB1C9`, terracotta becomes `#D07A5A`.\n\n**Type**\n- Display: **Instrument Serif** 400 + italic (Google; Latin-Ext, French accents OK). Fallback: `\'Iowan Old Style\', Georgia, serif`. Alternative: **Erode** or **Zodiak** (Fontshare).\n- UI: **Geist** 400/500/600 (Google). Fallback: `system-ui, -apple-system, \'Segoe UI\', Roboto, sans-serif`. Alternative: **General Sans** (Fontshare).\n- Data, coordinates, prices: **Geist Mono** 400/500 with tabular figures. Fallback: `ui-monospace, Menlo, monospace`.\n- Scale:\n  - Hero 104–120px, -3% tracking, line-height 0.95.\n  - Italic on one phrase only, always in `--azur` or `--terracotta`.\n  - H2 56px, H3 28px.\n  - Body 17/28 on the landing page; CRM UI 13.5/20.\n  - Mono eyebrows 11px uppercase, +8% tracking, bracketed: `[ 03 — RADAR QUARTIER ]`.\n\n**Shape and depth**\n- Radius: 10px on buttons and inputs, 18px on cards, 28px on hero media frames, 999px on chips.\n- Shadows, warm-tinted and never grey:\n  - Resting: `0 1px 0 rgba(25,24,21,.04), 0 8px 24px -12px rgba(60,45,25,.18)`.\n  - Lifted: `0 24px 60px -24px rgba(60,45,25,.28)`.\n- Glass: `rgba(251,248,243,.72)` + `blur(18px) saturate(120%)` + 1px `rgba(255,255,255,.6)` top edge, used only over photos.\n- Paper grain overlay at 3% opacity on `--calcaire` sections.\n\n**Motion**\n- Mediterranean: calm, light, a little buoyancy.\n- Reveals: 700ms `cubic-bezier(.65,.05,0,1)` (Mejuma\'s signature curve). Line-mask stagger 60ms.\n- UI hover/press: 180ms `cubic-bezier(.25,1,.5,1)`.\n- Success and confirm: 420ms `cubic-bezier(.3,1.4,.4,1)` (Loam overshoot), used sparingly.\n- Number tickers: 1200ms `cubic-bezier(.19,1,.22,1)` (111W57 expo-out).\n- Lenis lerp 0.1.\n\n**Signature hero:** "Fenêtre sur la mer".\n- Layout: limestone page; left, a 9-column headline in Instrument Serif: "Chaque vendeur mérite *un dossier d\'exception*." (italic in azur).\n- Right, a 28px-radius arched window frame (Provençal arch top) showing a slow video of the Antibes coastline.\n- On scroll, the arch pins and the view inside it cross-fades, through a sliding mask, into the actual NXT Agent seller cockpit, so the product appears inside the window.\n- Under the arch: a Chisel-style thin azur line diagram that connects "RDV" to "9 livrables". Each node pops in as the user scrolls.\n- Coordinates and live clock in Geist Mono.\n\n**Signature CRM:** "Le Dossier". Each seller is a document-like workspace on `--papier`.\n- A left vertical journey rail (Brief → Marché → Radar → Découverte → Livrables) fills with an azur ink line as steps complete.\n- The top line is a sentence: "Mme Laurent est prête pour l\'estimation, *2 comparables* changent votre fourchette."\n- The 9 deliverables appear as a fanned stack of paper cards. Hover lifts a card, click opens it full-bleed.\n- Projected values are hatched azur; real values are solid ink.\n- A night-mode toggle ("Mode nuit") switches to Nuit for late sessions.\n\n### Direction C: "Atelier Monolithe" (architectural, taupe and bronze)\n\n**Mood:** a 111W57 and Elyse gallery. Stone, bronze, blueprint. Condensed numerals like Nixtio\'s spec blocks, Didone display like Elyse. Feels like an architect\'s portfolio: severe, quiet, very confident.\n\n**Palette**\n\n| Token | Hex | Role |\n|---|---|---|\n| `--taupe` | `#5E5648` | hero and feature fields |\n| `--os` | `#ECE6DB` | page background (bone) |\n| `--lin` | `#F7F3EC` | cards |\n| `--grege` | `#CFC6B7` | lines, disabled |\n| `--anthracite` | `#151412` | text, spec blocks (black panels) |\n| `--bronze` | `#8C6A43` | accent, active, CTA |\n| `--bronze-clair` | `#B8946A` | hover, chart highlight |\n| `--blueprint` | `#2F4A5C` | AI, links, plan lines |\n| `--olive` | `#5F6B4E` | success |\n| `--ambre` | `#C08A3E` | warning |\n| `--brique` | `#9A3F33` | danger |\n\n**Type**\n- Display: **Bodoni Moda** (Google, optical-size axis) 400/italic. Fallback: `\'Didot\', \'Bodoni 72\', Georgia, serif`. Alternative: **Boska** (Fontshare).\n- UI and condensed numerals: **Archivo** variable (Google, wdth 62–125). wdth 100 for UI, wdth 62 weight 700 for big spec numerals ("450 M²"). Fallback: `\'Arial Narrow\', system-ui, sans-serif`. Alternative: **Cabinet Grotesk** (Fontshare).\n- Mono: **IBM Plex Mono** (Google). Fallback: `ui-monospace, monospace`.\n- Scale: hero 140px Didone with tight leading; spec numerals 72px condensed; body 16/26; meta mono 11px.\n\n**Shape and depth**\n- Radius: 0 everywhere (Aman, Barnes, Knight Frank), with 999px only on round icon buttons.\n- Shadows: none. Hierarchy comes from black spec slabs, 1px `--grege` rules, and blueprint line drawings.\n- Glass: not used. Use solid taupe overlays at 88% instead.\n\n**Motion**\n- Mechanical and precise, like sliding stone panels.\n- Reveals: 800ms `cubic-bezier(.7,0,.3,1)` (Sobha), wipe-from-edge clip-path.\n- Hover: 200ms linear-ish `(.4,0,.2,1)`.\n- Numerals roll digit by digit with a 40ms stagger.\n- Page transitions: vertical panel slide over 900ms.\n\n**Signature hero:** "Monolithe".\n- A taupe full-screen field with "N / X / T" stacked as in the 111W57 preloader.\n- The letters slide apart like doors to reveal a nocturnal villa photo, with "AGENT" in giant condensed Archivo masked behind the roofline (Nixtio depth).\n- Blueprint plan lines draw themselves over the facade.\n\n**Signature CRM:** "Planche". Each mandate is an architect\'s board:\n- Floor-plan thumbnail.\n- Black spec slab (Prix · Surface · DPE · Délai).\n- Condensed numerals.\n- A blueprint-line timeline.\n- The network console as a taupe "atlas" map with bronze pins.\n\n---\n\n## 3. Recommendation: Direction B, "Calcaire & Azur", with A\'s Nuit as the CRM dark theme\n\n**Why B:**\n1. **It is ownable.** The AI-SaaS references (Lev, NexusAI, Linear, the Dribbble CRMs) are almost all near-black with a neon accent, and the French luxury incumbents (Barnes, Féau, The Agency, Zingraf) are all white plus red plus caps. A limestone and azur system belongs to neither camp, and it is literally the colour of Antibes (old-town stone, Baie des Anges).\n2. **It is where 2026 winners are converging.** Every top-scoring site I measured pairs an elegant serif, often with an italic accent phrase, with a precise grotesk: Loam (Cormorant + DM Sans), Vestris, Lenval (Financier + Helvetica Now), Twenty (Aleo + Host Grotesk), Attio (Inter Display + Tiempos), Knight Frank (Tiempos + Suisse). Instrument Serif plus Geist is the free, Google-hosted version of that pairing.\n3. **It works for the product, not only the hero.** Agents spend hours in the CRM. Warm light paper with ink-blue reads better and feels less "gamer" than dark mode. The Nuit theme (warm/azur-tinted black, champagne accent) still covers evening use and showroom demos.\n4. **The 9 deliverables are print-like** (letters, services book, valuation report, condo dossier). B\'s paper/ink/ochre-gold system carries over directly to PDF and print. Knight Frank\'s report covers and The Blumont\'s stationery show how premium that can look.\n5. **AI gets one consistent voice.** Azur means "NXT did this": AI suggestions sit on `--azur-mist`, AI-written text carries an azur hairline, projections are hatched azur. That consistency is what makes a proactive AI trustworthy (Vestris\'s "human checkpoint", Palco\'s hatched forecasts).\n6. **It is cheap to build.** Every font is on Google Fonts, and the motion runs on GSAP, Lenis and CSS: no WebGL dependency for the core experience. A\'s Nocturne video and C\'s blueprint line-draw can still appear as single moments (the case-study section, the valuation report page).\n\n**Guardrails:**\n- One italic phrase per headline.\n- One terracotta spark per screen.\n- Champagne/ochre only on print and premium moments.\n- No gradients except the paper grain and photographic light.\n- No purple, anywhere.\n\n---\n\n## 4. Forty micro-interactions and animated components\n\n| # | Component | Spec (B timings unless noted) | Inspired by |\n|---|---|---|---|\n| 1 | Line-mask headline reveal | Each line slides up from `overflow:hidden`, 700ms `(.65,.05,0,1)`, 60ms stagger; the italic phrase lands last with a 1° skew settle | Loam House, Lenval |\n| 2 | Typographic preloader "N/X/T" | Stacked letters, then doors part to reveal the hero (Direction C) or fade (B); 1.4s total; skipped on revisit | 111 West 57th |\n| 3 | Arched "window" scroll-pin morph | Arch frame pins; the coastline video cross-masks into the product UI over 150vh of scroll | Lev (video), Vestris (product framed in scenery) |\n| 4 | Text-behind-subject depth mask | Wordmark sits between the photo background and a cut-out foreground layer; parallax 0.85 vs 1.0 | Nixtio Planetvision |\n| 5 | Market-bar skyline mask | Hero photo revealed through animated bars of real DVF price data, so the skyline is a chart | Serhii Yurkovskyi minimal |\n| 6 | Live local clock + coordinates | "Antibes 10:42 · 43°34′N 7°07′E" in mono, ticking each minute with a digit roll | Lenval, Cala Mira, Serhii |\n| 7 | Magnetic pill CTA with icon disc | Disc translates 6px toward the cursor; the label shifts 2px; 180ms `(.25,1,.5,1)` | Loam House buttons |\n| 8 | Split CTA (label + square arrow) | The arrow square slides right 4px and swaps the arrow on hover | Eloria (Orbix), 111W57 Inquire |\n| 9 | Inset rounded video frame that expands | 16px inset frame grows to full-bleed as the hero scrolls out (radius 28 to 0) | Mejuma, Aman |\n| 10 | Chisel-style line-diagram pipeline | SVG path draws RDV → Brief → Radar → Découverte → 9 livrables with `stroke-dashoffset` on scroll; nodes pop with overshoot | Chisel Industries |\n| 11 | Fanned deliverables stack | 9 paper cards fan out (rotate -6° to +6°); hover lifts 12px with a warm shadow; click flips to full preview | Minhaj collage, Blumont stationery |\n| 12 | Sticky stacked section cards | Each of the 9 deliverables pins, then the next card slides over at 96% scale | Elyse numbered sections, Linear |\n| 13 | Numbered bracket eyebrows | `[ 04 — RAPPORT D\'ESTIMATION ]` types in character by character (24ms/char) on enter | Folk, Elyse (3)(4)(5) |\n| 14 | Big-number ticker band | "+38 % de mandats exclusifs" counts up in 1200ms expo-out, tabular figures | Knight Frank 130 / 600+ / 20,000+ |\n| 15 | Network-logo marquee | Agency logos scroll continuously; hover pauses and desaturates the others | Vercel |\n| 16 | Before/after virtual staging slider | Draggable divider with spring physics plus a day/night style toggle; keyboard arrows supported | Nixtio day/night toggle |\n| 17 | Cursor-follow listing preview | Hovering a mandate row in the landing demo shows a floating 240px photo that lerps to the cursor (0.15), with a slight tilt from velocity | Elyse / Lenval galleries |\n| 18 | 3D tilt property cards | ±6° tilt toward the pointer, a sheen gradient follows, 300ms settle | Estateo property cards, Onero |\n| 19 | Glass lead-capture panel | "Recevez un exemple de dossier": blurred glass over the hero, fields underline-animate on focus | Loam House brochure panel |\n| 20 | Page-curtain transitions | Barba/View-Transitions wipe in `--azur-deep`, 900ms `(.7,0,.3,1)` | Lenval (Barba), Sobha |\n| 21 | AI streaming skeleton → content | Skeleton rows shimmer (1.6s loop), then resolve field by field with a 40ms stagger as the brief is written | Lev "Screen result" |\n| 22 | Headline-as-insight | The CRM home H1 is a generated sentence; key nouns are chips that open the record | Behance Agentic AI CRM |\n| 23 | Proactive brief rail | Greeting, 3–5 bullet insights, a 2x2 one-tap action grid; new insights slide in from the top with a soft azur flash | NexusAI right rail |\n| 24 | Command palette ⌘K | Fuzzy search across sellers, properties and actions; AI "Ask NXT" mode; 160ms scale-in from 0.98 | Clay nav ⌘K, Linear, Attio "Ask" |\n| 25 | Kanban with drag physics | Cards lift (scale 1.03, shadow lifted), rotate ±2° by drag velocity, spring-drop (stiffness 380, damping 30); column header € totals tick | Folk pipeline |\n| 26 | Seller journey ink rail | A vertical azur line fills between steps as each completes; the completed node gets an overshoot check | Linear activity timeline, Vestris steps |\n| 27 | Hatched forecast vs solid actual | Projected bars and lines drawn with an animated diagonal hatch pattern; real values morph solid when confirmed | Palco CRM |\n| 28 | Neighborhood radar map | Desaturated map; pins appear with a halo pulse (2s loop); the selected pin anchors a black stat capsule cluster | Nixtio smart dashboard |\n| 29 | Radar sweep | A conic-gradient sweep rotates once on load over the comparables map; each comparable pings as the beam passes | Sobha "3D Map", Nixtio pins |\n| 30 | Automation canvas with run history | Dotted-grid node editor; a live run animates a pulse along the edges; run list items show Running → Done | Attio Workflows |\n| 31 | Incoming-document auto-routing feed | A new item slides in, an AI badge "Classé → Dossier Laurent" morphs with a check, an undo chip stays 6s | Vestris document feed |\n| 32 | Segmented progress meters | Agent or network goals as 20-segment bars that fill segment by segment | Estateo agents, NexusAI barcode meters |\n| 33 | Property digital-twin cockpit | Blurred hero photo of the property; glass widgets (visits, offers, DPE, tasks) float with gentle parallax on pointer | Onero |\n| 34 | Spec slab with condensed numerals | Black block "Prix · Surface · Délai"; digits roll in individually | Nixtio Planetvision spec block |\n| 35 | Floor-plan level switcher | Arrows cross-fade plan levels with a 12px slide; the plan\'s lines draw in | Cala Mira (Lumios) |\n| 36 | Record navigator "1 / 84" | j/k keys move through sellers with a 120ms vertical slide of the detail pane | Linear |\n| 37 | Chip-cell data table | Inline-editable chip cells; row hover shows a dashed outline and quick actions; sticky first column | Twenty CRM, Palco hovered row |\n| 38 | Live toggle and status pills | iOS-style toggle with a spring thumb; the "Live" pill breathes (opacity .6 to 1, 2s) | Attio, NexusAI "Live" |\n| 39 | Deliverable "generated" reveal | A paper sheet rises from the card, the text writes in (typewriter mask), then an ochre seal stamp scales from 1.4 to 1 with overshoot | Blumont foil, Loam overshoot |\n| 40 | Night-mode transition | A circular reveal from the toggle position (View Transitions API, 600ms) between Calcaire and Nuit | Lenval light/dark sections, Nixtio day/night |\n\n---\n\n## Saved files index (`research/shots/`)\n\n- **Live captures (1440x900):** `site-loamhouse.jpeg`, `site-lenval.jpeg`, `site-111w57.jpeg`, `site-aman.jpeg`, `site-zingraf.jpeg`, `site-barnes.jpeg`, `site-feau.jpeg`, `site-knightfrank.jpeg`, `site-theagency.jpeg`, `site-lev.jpeg`, `site-linear.jpeg`, `site-attio.jpeg`, `site-twenty.jpeg`, `site-folk.jpeg`, `site-vercel.jpeg`, `site-clay.jpeg`, `site-arc.jpeg`.\n- **Awwwards:** `aw-lev.jpg`, `aw-lenval.jpg`, `aw-loam-house.jpg`, `aw-mejuma.jpg`, `aw-sobha-privy.jpg`, `aw-mrc-boca.png`, `aw-rialto.jpg`.\n- **Dribbble (1600x1200):** `drb-nixtio-luxury.webp`, `drb-elyse-phenomenon.webp`, `drb-lumios-editorial.webp`, `drb-serhii-minimal.webp`, `drb-minhaj-editorial.webp`, `drb-eloria-orbix.webp`, `drb-onero-crm.webp`, `drb-palco-crm.webp`, `drb-nixtio-dashboard.webp`, `drb-nexusai-dark.webp`, `drb-estateo-outcrowd.webp`.\n- **Behance:** `be-agentic-ai-crm.jpg`, `be-re-platform.jpg`, `be-propflow.png`, `be-re-investment.png`, `be-valuation.png`, `be-lunare.png`, `be-blumont.jpg`, `be-jawhara.jpg`.\n- **Land-book:** `lb-vestris.webp`, `lb-chisel.webp`, `lb-flamingo.webp`.\n',an="# 02 — Benchmark motion : landing NXT Agent (animée, dynamique, interactive, luxe)\n\n**Date de recherche : 11 octobre 2026.** Sources : navigation de motionsites.ai dans le navigateur intégré (sans compte, aucune connexion), lecture complète de 3 prompts gratuits (Agent Wave, Space Voyage, Monolith Hero), détection des librairies sur 3 sites Awwwards immobilier, sources GitHub et registre npm, WebSearch/WebFetch. Captures dans `shots/ms-*.jpg`.\n\n**Contexte stack :** `nxt-agent` tourne sur un serveur Node simple (`server.mjs`, pas de bundler). Toutes les recommandations ci-dessous marchent donc **en vanilla JS + CDN** (ESM ou UMD). Les librairies React (React Bits, Aceternity, Magic UI) servent de **références à porter**, pas de dépendances.\n\n---\n\n## 0. Ce qu'il faut retenir (TL;DR)\n\n1. **Le « wow » des meilleurs sites MotionSites ne vient pas surtout du WebGL.** Il vient de la combinaison suivante : une **vidéo IA cinématographique** plein écran (générée avec Higgsfield/Kling, hébergée sur CloudFront), une **typographie retenue** (Inter + un mot en *Instrument Serif italic*), une **chorégraphie d'entrée en CSS** (lignes masquées qui montent, flou → net, délais échelonnés), du **grain**, des **boutons « liquid glass / liquid metal »** avec un reflet qui balaie le bouton au survol, et un **parallax souris amorti**. Le prompt Agent Wave interdit même explicitement vidéo/WebGL/Three/Lottie pour la page elle-même : la vidéo y sert de fond, rien de plus.\n2. **Les sites immobiliers primés en 2026 utilisent GSAP + Lenis.** ERA Residence (Awwwards Site of the Month, août 2026) charge `gsap@3.15` + ScrollTrigger + SplitText + CustomEase, `lenis@1.3.21`, Barba et Lottie. Sobha Privy Collection (SOTD, sept. 2026) utilise Three.js, Barba, ScrollTrigger, des transitions vidéo en `clip-path` et 12 vidéos sur la page.\n3. **Stack recommandée pour NXT Agent :**\n   - GSAP 3.15.0 (ScrollTrigger, SplitText, Flip, Draggable, CustomEase, tous gratuits depuis 3.13) ;\n   - Lenis 1.3.26 ;\n   - `motion` 13.4.4 en vanilla pour les micro-interactions ;\n   - `@paper-design/shaders` 0.0.81 pour un mesh gradient ou un grain très léger ;\n   - OGL 1.0.11 seulement si un shader sur mesure est nécessaire.\n   - À éviter : Spline ou Three.js pour un « bâtiment 3D » (lourd et gadget pour du B2B luxe).\n4. **Signature visuelle proposée :**\n   - Hero : vidéo IA d'une villa de la Riviera à l'heure dorée (Antibes, donc ancrée dans le pilote), titre en lignes masquées avec l'accent serif italique.\n   - Parcours produit : un **rail de chapitres** inspiré de Stratum (BRIEF → MARCHÉ → QUARTIER → PRÉPARATION → ENTRETIEN → LIVRABLES) épinglé au scroll.\n   - Final : les **9 livrables L1–L9** se déploient en éventail puis en grille (GSAP Flip, à la manière de « Book Hero »).\n\n---\n\n## 1. motionsites.ai : exploration\n\n### 1.1 Ce qu'est le site\n- **Bibliothèque de prompts payante** de Viktor Oddy (YouTube @ViktorOddy). Elle revendique « 500+ premium website design prompts ». Chaque carte ouvre `/?prompt=<slug>` : aperçu vidéo (MP4 sur R2 ou HLS) et bouton « Copy full prompt » (gratuit, **3 copies max sans compte**) ou « Go Unlimited » (premium, verrouillé). « Copy source code » est toujours verrouillé.\n- **Catégories (filtres) :** All, Recent, Apps, Sections, Hero, Landing Page, SaaS, Creative, Agency, Portfolio, 3D, AI, Fintech, Technology, Travel, Wellness, 3D Website, Ecommerce, Carousel. Tri Popular / Pricing.\n- **Autres rubriques :**\n  - `/backgrounds` : vidéos de fond animées, « Copy URL » ;\n  - `/mcp` : serveur MCP pour Claude, Cursor et Codex qui injecte les prompts dans l'agent, réservé aux plans payants ;\n  - `/restyle`, `/academy` ;\n  - « Explore the Full Library » renvoie vers designrocket.io.\n- **Environ 330 cartes** chargées en scroll infini. Celles qui touchent notre sujet : *Sky Estate [Real Estate], Luxury Real Estate, Zenith Realty, Monolith Hero [Architecture], Monolithic [Luxury], Custom Spaces, Mountain Retreat, Investment Gate, Wealthcore, Golden Identity, Liquid Glass Agency, Layered Depth, Scroll Landing Page, Kairo Studio [Reveal], Particle Field [WebGL], Book Hero*.\n\n### 1.2 Recettes techniques décodées (3 prompts gratuits lus en entier)\n\n**A. Agent Wave / « Vesper.ai » (hero SaaS IA, 16 675 caractères).**\n- Une seule page HTML, CSS inline et un petit IIFE ; fond `#000`.\n- Fond : vidéo MP4 CloudFront (`hf_2026…` = sortie Higgsfield) à 100 % d'opacité, avec un scrim `::after` et une couche `.grain` en `z-index:100`.\n- **Typo :** Inter 100–900 ; *Instrument Serif italic* **uniquement** sur les mots « AI agents », en gris `#9a9a9a`, `1.08em`, entrée `blur(4px)` → net.\n- **H1 en deux lignes masquées :** `.headline-line{overflow:hidden}`, keyframe `translateY(40%)` → 0.\n- **Entrées CSS :** `cubic-bezier(0.16,1,0.3,1)`, 1.05 s, `--d` échelonné de 0.08 à 1.44 s. Sept variantes : scale 0.84, soft +14 px, mask, pop 0.9 → 1.03 → 1, btn, side +22 px, stat.\n  - Garde-fou utile : opacité de repos à 1, `animationend` ajoute `.is-in`, et un fallback JS après deux `requestAnimationFrame` si aucune animation ne tourne. La page n'est jamais blanche.\n- **Boutons liquid-metal :**\n  - fond `linear-gradient(105deg,#050505,#2a2a2a 48%,#4a4a4a)` ;\n  - bordure `rgba(198,198,198,.55)` ;\n  - reflet `::before` qui passe de `translateX(-120%)` à `120%` en 0.6 s au survol ;\n  - lueur au survol `0 0 18px rgba(200,210,230,.18)`.\n  - Le ghost CTA a un `backdrop-filter: blur(16px)`.\n- **Mise en page :** hero aligné **en bas** (pas centré verticalement) et footer de 3 stats avec icônes SVG.\n- **Accessibilité :** `prefers-reduced-motion` neutralise tout.\n\n**B. Space Voyage / « Planet Jumping » (23 849 caractères).**\n- Aucune librairie externe. **Préchargeur vidéo** avec compteur `0 → 100 %`, sortie en `blur(7px)` et translation.\n- Le logo glisse du centre vers le header en 2 s.\n- **Portail canvas** (masque animé `maskScale 0 → 1` sur 1050 ms) qui révèle la scène, tilt 3D au pointeur, **curseur custom** (point de 12 px + anneau de 36 px amorti) qui affiche « Enter ».\n- Transitions vidéo de planète en planète : `TO_EARTH.mp4`, etc.\n\n**C. Monolith Hero / « Stratum » (68 381 caractères), le plus pertinent : c'est un site de promoteur immobilier.**\n- **Cadre** hairline à 30 u avec chanfreins de 26 u aux coins.\n- **Rail d'index vertical** à 6 chapitres (VISION, EXPRESSION, CRAFTSMANSHIP, REFINEMENT, BALANCE, ORIGIN). Chaque chapitre a sa **vidéo de scène** (8–16 s, encodée en ping-pong avant/arrière, CRF 20–23) : fondu d'opacité de 0.9 s, chargement paresseux via `data-src`, pause 950 ms après sortie.\n- **Changement de texte :** chaque ligne du titre redescend dans son masque (`translateY(112%)`, 0.5 s `cubic-bezier(.16,1,.3,1)`), on change le texte, puis la ligne remonte. Les libellés se **« décodent »** façon scramble au changement d'état.\n- **Parallax souris :** lerp de 0.045 par frame, décalage de ±1.5 % et léger zoom vers le bas ; la boucle rAF s'arrête quand la cible est atteinte.\n- **Système d'unités :** `--u: clamp(.68px, min(100vw/1280, 100dvh/800), 1.72px)`, donc tout est mis à l'échelle d'un canvas de 1280×800. Polices auto-hébergées en sous-ensemble ASCII (~7 Ko chacune).\n- Dock bas : AUDIO ON/OFF, SCROLL TO UNCOVER, TALK WITH US.\n\n**Conclusion méthode :**\n- Visuel = vidéo IA de qualité + typographie + timing. Code = CSS keyframes + un peu de JS.\n- Pour NXT Agent, on garde cette base légère et on ajoute **GSAP ScrollTrigger** pour la partie storytelling, absente de ces prompts mono-écran.\n\n### 1.3 Top 15 des exemples MotionSites (URL = `https://motionsites.ai/?prompt=<slug>`)\n\nSlugs vérifiés quand indiqués. Pour les autres, ouvrir la carte depuis la home : le slug suit le titre.\n\n| # | Exemple (catégorie) | URL | Ce qui le rend impressionnant / réutilisable pour NXT |\n|---|---|---|---|\n| 1 | **Monolith Hero** (Architecture, gratuit) | `?prompt=monolith-hero` | Promoteur immobilier : rail de 6 chapitres, une vidéo par chapitre en fondu, titre masqué qui se remplace, libellés « décodés », parallax souris amorti, cadre chanfreiné. **Modèle direct du parcours D1 → L9.** |\n| 2 | **Luxury Hero** (Hero) | `?prompt=luxury-hero` | Villa méditerranéenne à l'heure dorée en vidéo, titre en capitales serif, nav pill en verre, CTA « Book a tour ». C'est le ton visuel visé (Riviera). |\n| 3 | **Sky Estate** (Real Estate) | `?prompt=sky-estate` | Titre géant placé **derrière** le sujet (tour dans les nuages) : effet de profondeur par calques et détourage. Nav glass. |\n| 4 | **Zenith Realty** (Landing Page) | `?prompt=zenith-realty-landing` | Landing immobilière éditoriale : hero maison d'architecte, cartes de biens, bloc « Exclusive collection ». Bonne référence de grille et de rythme. |\n| 5 | **Luxury Real Estate** (Landing Page) | `?prompt=luxury-real-estate` | Plans architecturaux serrés (aplats rouges, ciel), minimalisme et vidéo lente : « l'architecture comme texture ». |\n| 6 | **Custom Spaces** (Design) | home → « Custom Spaces » | « Bespoke Architecture Studio » : bande d'intérieurs en accordéon horizontal qui s'élargit au survol. |\n| 7 | **Agent Wave** (AI, gratuit) | `?prompt=agent-wave` | Hero SaaS IA : onde de particules N&B, accent serif italique gris, boutons liquid-metal, stats en bas. **Spécification complète lue** (§1.2 A). |\n| 8 | **AI Runtime** (AI, gratuit) | home → « AI Runtime » | « Intelligence designed to evolve » : arc d'horizon lumineux, typographie mono espacée, stats. Ton IA premium sans cliché robot. |\n| 9 | **Anchor AI** (Portfolio) | home → « Anchor AI » | Arbre de particules bleues (« Streamlined Insurance Operations ») : métaphore de données organiques pour du B2B. |\n| 10 | **Neuralyn** (SaaS, gratuit) | home → « Neuralyn » | Hero dashboard en surimpression sur une scène (« Your insights, one clear view ») : maquette produit mise en scène. |\n| 11 | **Space Voyage** (Creative, gratuit) | `?prompt=space-voyage` | Préchargeur à compteur %, révélation par masque canvas, curseur custom, transitions vidéo. |\n| 12 | **Golden Portal** (Landing Page) | `?prompt=golden-portal` | Ciel peint doré en vidéo, colombes, mélange serif/sans « DIGITAL ARCHIVE ». Palette or/ivoire transposable. |\n| 13 | **Scroll Landing Page** (Interactive) | `?prompt=scroll-landing` | Storytelling cinématique piloté par le scroll (« Championing the pitch of legends ») : séquence vidéo scrubbée. |\n| 14 | **Interactive Discovery** (Hero, gratuit) | `?prompt=interactive-discovery` | Strates 3D de terrain (« Layers hold tales of time ») et serif italique : métaphore « couches de données du quartier » (D2/D3). |\n| 15 | **Book Hero** (Hero) | home → « Book Hero » | Livres en éventail 3D (« Foliom ») : **métaphore exacte pour présenter les 9 livrables** en pile ou éventail. |\n\nMentions : *Dream Garden* (éditorial mode, vidéo), *Atrium MTL* (éditorial N&B et couleurs), *Monolithic* [Luxury], *Investment Gate*, *Wealthcore*, *Liquid Glass Agency*, *Layered Depth* (tous premium, non ouverts en détail).\n\n---\n\n## 2. Galeries, bibliothèques et outils similaires (20)\n\n| # | Site | Ce qu'il offre | 2–3 composants/effets à prendre pour NXT (luxe immo + IA) |\n|---|---|---|---|\n| 1 | **React Bits** (reactbits.dev, GitHub DavidHDev/react-bits) | Plus de 130 composants open source (JS/TS × CSS/Tailwind), CLI. Fonds en OGL ou WebGL brut, texte en GSAP/Motion. | **Grainient** (OGL, dégradé granuleux) ou **Silk** (three + R3F) pour le hero et le CTA ; **SplitText** et **ScrollReveal** (GSAP + ScrollTrigger) ; **Magic Bento** (GSAP, halo qui suit le curseur). Aussi : DecryptedText, CountUp, GradualBlur, GlassSurface, ScrollStack, Stepper. |\n| 2 | **Aceternity UI** (ui.aceternity.com) | Composants Tailwind + Motion, blocs payants. | **Sticky Scroll Reveal** (texte à gauche, visuel collant à droite : parcours produit) ; **Animated Testimonials** (pile de portraits + texte mot à mot) ; **Container Scroll Animation / Macbook Scroll** (démo CRM qui se redresse au scroll). Aussi : Timeline, Bento Grid, SVG Mask Effect, Spotlight. |\n| 3 | **Magic UI** (magicui.design) | Plus de 150 composants shadcn + Motion. | **Animated Beam** (sources DVF/INSEE/cadastre reliées au cœur IA) ; **Number Ticker** (KPIs) ; **Safari / iPhone mocks** + **Border Beam** (cadre de démo CRM). Aussi : Bento Grid, Marquee, Blur Fade, Progressive Blur. |\n| 4 | **Cult UI** (cult-ui.com) | shadcn, orienté IA et landing. | **Dynamic Island** (notifications d'agent IA dans la démo CRM) ; **Agent Suggest Card Stack** ; **Hero Liquid Metal / Hero Dithering** (Paper Shaders). Aussi : Texture Card, Fluted Glass, Rolling Number. |\n| 5 | **21st.dev** | Catalogue communautaire (heroes, pricing, testimonials, shaders) en registre shadcn, avec « Copy prompt » pour agent. | Sections pricing à bascule, testimonials marquee, heroes shader. À parcourir par recherche « pricing », « testimonial », « shader ». |\n| 6 | **Paper Shaders** (shaders.paper.design) | Shaders canvas **sans dépendance**, vanilla ou React. | **Mesh Gradient** (encre / champagne / ivoire, très lent) ; **Grain Gradient** ou **Paper Texture** (matière luxe) ; **Liquid Metal** (logo NXT au CTA) ; **God Rays** (CTA final). Aussi : Fluted Glass (filtre image), Dithering. |\n| 7 | **Unicorn Studio** (unicorn.studio) | Éditeur no-code de scènes WebGL, embed `data-us-project` + `unicornStudio.umd.js`. | Fond de hero interactif (lumière qui suit la souris sur du marbre ou un plan) produit sans code ; à réserver à une variante A/B. Badge sur le plan gratuit. |\n| 8 | **ShaderGradient** (shadergradient.co, `@shadergradient/react` 2.4.20) | Dégradés 3D animés configurables (R3F). | Bloc « aurore » doux derrière le pricing ; trop « startup » s'il est saturé, à garder désaturé. |\n| 9 | **Spline Community** (spline.design/community) | Scènes 3D remixables, runtime `@splinetool/runtime`. | Possible : maquette architecturale low-poly en rotation lente. **Déconseillé** en hero (runtime lourd, look jouet). |\n| 10 | **Motion.dev examples** (motion.dev/examples) | Plus de 470 exemples React, JS et Vue. | **Price switcher** + **Number counter** (pricing) ; **Scroll Zoom Hero** et **Scroll Text Lines** ; **Shared layout** (cartes de livrables qui s'ouvrent en modal). Aussi : Scramble text, Ticker. |\n| 11 | **GSAP Showcase** (gsap.com/showcase) | Vitrine des sites GSAP (A24, Illoca by Unseen, Guillaume Colombel…). | Patterns d'épinglage et de scrub, SplitText, Flip. Référence de qualité pour le timing. |\n| 12 | **Codrops** (tympanus.net/codrops) | Tutoriels et démos open source (GitHub org codrops). | **SVG mask transitions on scroll** (mars 2026 : grille et stores qui révèlent des photos plein écran) ; **Cinematic 3D scroll with GSAP** (nov. 2025) ; **Horizontal parallax gallery DOM → WebGL** (fév. 2026). |\n| 13 | **Awwwards, catégorie Real Estate** | Sites primés 2026. | ERA Residence (SOTM, GSAP + Lenis + SplitText) ; Sobha Privy Collection (Three + clip-path vidéo) ; Hubtown (Unseen Studio, canvas WebGL) ; LIKOVA, Realevate, 360 Lexington. |\n| 14 | **Recent** (recent.design, anciennement godly.website, qui redirige en 301) | Inspiration web, motion et 3D filtrable. | Filtres Motion, Web, 3D, Editorial pour les micro-interactions (sliders, sélecteurs). |\n| 15 | **Lapa Ninja** (lapa.ninja) | Galerie gratuite de landing pages par catégorie (dont Real Estate et AI). | Structure de sections SaaS IA (preuves, intégrations, FAQ). |\n| 16 | **Framer Marketplace** (templates immo) | Templates luxe animés : **VELLUME** (hero cinématique au scroll), **Haven Noir** (masterplan architectural animé), ROYAL, Aurelia, Lume States (stats animées). | Hero scrubbé (Vellume) ; masterplan interactif (Haven Noir, à transposer en « carte des livrables ») ; stats animées. |\n| 17 | **Uiverse** (uiverse.io) | Plus de 6000 éléments CSS/Tailwind open source. | Boutons shine/metal, toggles, loaders sans JS. |\n| 18 | **Rive Community** (rive.app/community) | Animations à états interactives et très légères. | Micro-illustration « agent qui écoute » (onde vocale pendant l'entretien D5) avec état idle/talking. |\n| 19 | **LottieFiles** (dotLottie) | Animations vectorielles. | Icônes animées des 9 livrables (mail, WhatsApp, réseaux sociaux…). ERA Residence utilise lottie-web 5.12.2. |\n| 20 | **MotionSites `/backgrounds`** | Vidéos de fond IA « Copy URL ». | Source d'inspiration pour briefer la génération de notre propre vidéo (Higgsfield, Kling, Veo). |\n\n---\n\n## 3. Effets à construire, section par section (implémentables)\n\n### 3.0 Versions épinglées (vérifiées sur npm le 11/10/2026, toutes publiées depuis plus de 2 semaines)\n\n| Lib | Version | Publiée | CDN |\n|---|---|---|---|\n| gsap (+ScrollTrigger, SplitText, Flip, Draggable, CustomEase) | **3.15.0** | 2026-04-13 | `https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js` (+ `/dist/ScrollTrigger.min.js`, `/SplitText.min.js`, `/Flip.min.js`, `/Draggable.min.js`, `/CustomEase.min.js`) |\n| lenis | **1.3.26** | 2026-08-05 | `https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js` + `lenis.css` |\n| motion (vanilla : animate, scroll, inView) | **13.4.4** | 2026-09-25 | `https://cdn.jsdelivr.net/npm/motion@13.4.4/+esm` (la 14.x est sortie le 2 oct., trop récente) |\n| @paper-design/shaders (vanilla) / -react | **0.0.81** | 2026-09-17 | `https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.81/+esm` (**épingler** : changements cassants possibles en 0.0.x) |\n| ogl | **1.0.11** | 2025-01-27 | `https://cdn.jsdelivr.net/npm/ogl@1.0.11/+esm` |\n| three (seulement si nécessaire) | **0.186.0** | 2026-09-08 | `https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.min.js` |\n| unicornstudio.js (option) | **v2.2.14** | 2026-09-12 | `https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.2.14/dist/unicornStudio.umd.js` |\n\nPolices (Google Fonts ou auto-hébergées en sous-ensemble) : **Inter** (UI) et **Instrument Serif italic** (accent), ou un serif display plus « maison » (Cormorant, Fraunces) pour les titres.\n\n### 3.1 Socle global\n- **Smooth scroll Lenis synchronisé avec GSAP :**\n  ```js\n  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });\n  lenis.on('scroll', ScrollTrigger.update);\n  gsap.ticker.add(t => lenis.raf(t * 1000));\n  gsap.ticker.lagSmoothing(0);\n  ```\n  Désactiver Lenis si `prefers-reduced-motion`.\n- **Préchargeur sobre** (Space Voyage) : compteur 0 → 100 % lié au `canplaythrough` de la vidéo hero et à `document.fonts.ready`. Le logo NXT glisse ensuite vers le header (GSAP Flip). **Plafonner à 1.2 s** ; ne pas l'afficher aux visites suivantes (`sessionStorage`, dans un try/catch).\n- **Grain global :** `.grain` fixe, SVG `feTurbulence` en data-URI, `opacity:.06`, `mix-blend-mode:overlay`.\n- **Chorégraphie d'entrée** (recette Agent Wave) : `cubic-bezier(0.16,1,0.3,1)`, délais échelonnés via `--d`, opacité de repos à 1 et fallback `.is-in`.\n- **Curseur custom** (desktop, `pointer:fine` uniquement) : point + anneau amortis, l'anneau grossit sur les éléments interactifs.\n- **Libellés « décodés »** (Stratum) : scramble sur la nav et les chapitres, avec `motion` ou 20 lignes de JS.\n- **Accessibilité :** `prefers-reduced-motion` coupe pin et scrub et affiche les états finaux ; focus visibles ; vidéos `muted playsinline` avec poster.\n\n### 3.2 Hero\n- **Recommandé, « Riviera cinématique » :**\n  - **Vidéo :** villa contemporaine sur la côte d'Antibes à l'heure dorée, travelling très lent, 8–10 s, **encodée en ping-pong** (boucle sans saut, technique Stratum).\n    - Formats : H.264 CRF 23 (~2–3 Mo) + AV1/WebM, poster WebP < 60 Ko.\n    - Chargement : `preload=\"metadata\"`, puis `src` posé après le premier rendu.\n  - **Titre :** GSAP **SplitText** avec masque de lignes et un mot en *serif italique* champagne qui passe de `blur(4px)` à net :\n    ```js\n    SplitText.create('.hero h1', {\n      type: 'lines', mask: 'lines', autoSplit: true,\n      onSplit: s => gsap.from(s.lines, { yPercent: 110, duration: 1.1, stagger: .08, ease: 'expo.out' })\n    });\n    ```\n  - **Profondeur :** parallax souris lerp 0.045 sur la vidéo (Stratum) et léger `scale` au scroll (ScrollTrigger `scrub`).\n  - **CTA :** « Demander une démo » en liquid-glass (dégradé champagne → ivoire, reflet `::after` de -130 % à 130 % en 0.65 s) + bouton ghost « Voir le parcours » en `backdrop-filter: blur(16px)`.\n  - **Bas de hero** (aligné en bas comme Agent Wave) : 3 stats (« 9 livrables générés », « 1 h → 5 min », « Antibes · pilote »), en Number Ticker.\n- **Variante B (sans vidéo) :** Paper Shaders **MeshGradient** en encre `#0E1116`, bronze `#8C6A43`, champagne `#D9C7A3` et ivoire `#F4EFE6`, `speed: .08`, `distortion: .6`, `swirl: .2`, plus GrainGradient en overlay. Option : **texte derrière le sujet** (Sky Estate) avec une photo de villa détourée (PNG/WebP alpha) au-dessus d'un titre géant.\n- **Variante C :** scène Unicorn Studio (lumière rasante sur du travertin qui suit la souris). Test A/B uniquement.\n- **À éviter :** bâtiment 3D Spline ou Three.js (poids, LCP, rendu « jouet »).\n\n### 3.3 Storytelling du flux produit : brief → entretien → 9 livrables\n- **Structure « rail de chapitres » (Stratum) :** section épinglée par `ScrollTrigger.create({ pin: true, scrub: 1, end: '+=400%' })` avec un timeline maître. **Rail vertical à gauche :** D1 BRIEF · D2 MARCHÉ · D3 QUARTIER · D4 PRÉPARATION · D5 ENTRETIEN · L1–L9 LIVRABLES. L'item actif reçoit un marqueur et son libellé est « décodé ».\n- **Scène à droite, qui change par chapitre :**\n  1. **Brief (D1) :** carte de fiche vendeur qui se remplit champ par champ (texte « tapé », DecryptedText).\n  2. **Marché et quartier (D2/D3) :** carte d'Antibes en SVG (tracé `stroke-dashoffset` scrubé) avec points DVF qui apparaissent et **Animated Beam** des sources vers le cœur NXT.\n  3. **Entretien (D5) :** transcript qui défile, onde vocale (Rive ou SVG animé) et puces « insights » extraites qui se détachent et vont se ranger (GSAP Flip).\n  4. **Livrables :** pile de 9 documents (vignettes réelles L1…L9 depuis les PDF du dossier) qui **s'ouvre en éventail 3D** (`rotateY`, `perspective`, à la manière de Book Hero), puis se **réorganise en grille 3×3** avec `Flip.from(state, { stagger: .05, ease: 'power3.inOut' })`. Compteur 0 → 9.\n- **Changement de texte entre chapitres :** lignes masquées qui descendent puis remontent (`yPercent: 112`), 0.5 s.\n- **Option vidéo scrubbée :** séquence d'images WebP (~90–120 frames, 1280 px) dessinée sur `<canvas>` selon la progression ScrollTrigger (méthode Apple). Plus fiable que `video.currentTime` ; sinon, encoder la vidéo avec une image clé à chaque frame (`ffmpeg -g 1`).\n- **Amélioration progressive gratuite :** CSS `animation-timeline: view()` pour les apparitions simples hors section épinglée.\n- **Mobile :** pas de pin ; chapitres empilés avec reveals `inView` (motion) ; éventail remplacé par un carrousel horizontal `scroll-snap`.\n\n### 3.4 Bento des fonctionnalités\n- Grille 4×3 irrégulière : CRM, Automatisations, Console multi-agences, Conformité, Données sourcées, Kit réseaux sociaux.\n- **Halo de bordure qui suit le curseur** (Magic Bento) : variables CSS `--mx/--my` sur `pointermove` et `radial-gradient(400px at var(--mx) var(--my), rgba(217,199,163,.18), transparent)` sur un pseudo-élément masqué en bordure (`mask-composite`). Tilt léger (±4°) avec `gsap.quickTo`.\n- **Micro-démos dans les cartes :** Number Ticker, **Border Beam** sur la carte phare, mini-graphe SVG tracé au scroll, marquee de logos de portails/outils.\n- **Apparition :** `ScrollTrigger.batch('.bento-card', { onEnter: b => gsap.from(b, { y: 40, opacity: 0, stagger: .08 }) })`.\n\n### 3.5 Démo interactive du CRM\n- **DOM réel, pas une vidéo :** un mock du CRM NXT dans un cadre navigateur (Magic UI Safari mock + Border Beam), qui **se redresse au scroll** (Aceternity Container Scroll : `rotateX 20° → 0`, `scale .9 → 1`, scrub).\n- **Interactions jouables :**\n  - **Kanban** des mandats déplaçable : GSAP **Draggable** + **Flip** pour réordonner les colonnes « Estimation → Mandat → Vente ».\n  - **Palette Ctrl+K** : taper « Prépare le RDV MARTIN » déclenche un streaming de texte (scramble puis typewriter) et génère les cartes L1–L9 avec des toasts **Dynamic Island** (Cult UI) du type « L7 Analyse de valeur prête ».\n  - **Onglets animés** (indicateur partagé, layout animation de motion) : Pipeline / Agenda / Livrables / Équipe.\n- Données factices réalistes : Antibes, biens, noms fictifs. Aucune donnée réelle.\n\n### 3.6 Témoignages\n- **Animated Testimonials** (Aceternity) : pile de portraits d'agents (rotation aléatoire ±8°, l'actif passe devant) avec citation en *Instrument Serif* révélée mot à mot (blur → net). Autoplay 6 s avec pause au survol.\n- Variante : marquee double sens à masque de bord (`mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)`), vitesse modulée par la vélocité de scroll (React Bits ScrollVelocity / Motion Ticker).\n- Logos d'agences et réseaux en LogoLoop grisé, en couleur au survol.\n\n### 3.7 Pricing\n- **Bascule mensuel/annuel** : chiffres animés (Motion « Price switcher » ou `gsap.to(obj, { val, snap: { val: 1 } })`).\n- Carte recommandée avec **Shine/Border Beam** champagne et fond **GlassSurface** ; les autres cartes sont mates.\n- Bascule Agence / Réseau (multi-agences) avec indicateur partagé animé.\n- Lignes de fonctionnalités en `stagger` au premier passage uniquement (`once: true`).\n\n### 3.8 CTA final et footer\n- **Retour du hero :** la vidéo Riviera revient dans un `clip-path: inset(20% 30% round 24px)` qui s'ouvre en plein écran au scroll (ScrollTrigger scrub, technique Sobha Privy), avec le titre CTA en SplitText.\n- **Bouton magnétique** (attraction de ±12 px, `gsap.quickTo`) et logo NXT en **Liquid Metal** (Paper Shaders) ou **God Rays** très discrets.\n- **Footer :** wordmark « NXT AGENT » géant révélé par masque (`yPercent: 100 → 0`) en bas de page.\n\n### 3.9 Budget performance (garde-fous)\n- LCP < 2.5 s : le poster de la vidéo hero est l'élément LCP, préchargé avec `<link rel=\"preload\" as=\"image\">`.\n- JS motion ≤ ~90 Ko gzip au total (gsap ~28, ScrollTrigger ~18, SplitText ~8, Flip ~7, Lenis ~4, Paper Shaders ~15).\n- Un seul contexte WebGL actif à la fois ; mettre en pause shaders et vidéos hors écran (IntersectionObserver).\n- Vidéos chargées en différé par chapitre (`data-src`, méthode Stratum) et mises en pause 950 ms après sortie.\n\n---\n\n## 4. URLs de référence prioritaires\n\n1. https://motionsites.ai/?prompt=monolith-hero : rail de chapitres immobilier (modèle du parcours)\n2. https://motionsites.ai/?prompt=luxury-hero : ton visuel villa Riviera\n3. https://motionsites.ai/?prompt=agent-wave : recette hero IA (typo, boutons, entrées)\n4. https://motionsites.ai/?prompt=sky-estate : titre derrière le sujet\n5. https://www.era-residence.com/ : GSAP 3.15 + SplitText + Lenis en production (SOTM août 2026)\n6. https://sobha-privy-collection.com/ : transitions vidéo en clip-path + Three (SOTD sept. 2026)\n7. https://reactbits.dev/components/magic-bento (+ `/backgrounds/grainient`, `/text-animations/split-text`)\n8. https://ui.aceternity.com/components/sticky-scroll-reveal (+ animated-testimonials, container-scroll-animation)\n9. https://shaders.paper.design/ : Mesh Gradient, Grain Gradient, Liquid Metal\n10. https://magicui.design/docs/components/animated-beam (+ number-ticker, safari)\n11. https://motion.dev/examples : price switcher, scroll zoom hero\n12. https://tympanus.net/codrops/ : SVG mask transitions on scroll (mars 2026), cinematic 3D scroll (nov. 2025)\n13. https://www.awwwards.com/inspiration_search/real-estate/\n14. https://www.framer.com/marketplace/templates/vellume/ : hero luxe scrubbé\n15. https://cult-ui.com/docs : Dynamic Island, Agent Suggest Card Stack, Hero Liquid Metal\n\n## 5. Limites\n- Prompts premium MotionSites non lus (paywall). Seuls 3 prompts gratuits ont été décodés intégralement, et la limite de 3 copies sans compte est atteinte. Aucun compte créé, aucune connexion.\n- Les cookies d'ERA Residence n'ont pas été acceptés : le bandeau était hors écran.\n- Détection de librairies sur Hubtown non concluante (bundle minifié, 1 canvas WebGL).\n- Versions de `@splinetool/runtime`, `@rive-app/*` et `@lottiefiles/dotlottie-web` non datées : à vérifier avant usage.\n",on=`# 04 — Idées produit et automatisations NXT Agent\r
\r
*Version du 11/10/2026. 398 idées (\`src/data/ideas.json\`), 100 routines (\`routines.json\` + \`routines-extra.json\`). Sources : audit documentaire (§ 4–8), backlog des 240 idées, catalogue des 60 routines, benchmark v2, recherches design et motion.*\r
\r
Conventions : **Phase** P0 pilote → P3 expansion · **Effort** S < 1 sem., M 1–3 sem., L 1–2 mois, XL > 2 mois · **Impact** 1–5 · **Statut** « maquette » = visible dans la maquette actuelle (landing + CRM), sinon « proposé ». Numérotation L1–L9 alignée sur la maquette (L3 acquéreurs, L4 social, L5 voisinage).\r
\r
## 1. Synthèse\r
\r
- **Volume** : 398 idées sur 21 thèmes ; P0 : 104, P1 : 170, P2 : 104, P3 : 20 ; 56 déjà maquettées, 342 proposées.\r
- **Fil rouge** : NXT est l’agent du mandat vendeur — il prépare, produit les livrables qui font signer, prouve leur conformité et s’installe au-dessus du CRM existant.\r
- **Ce qui a changé en 2026** : démarchage téléphonique opt-in depuis le 11/08/2026 (le courrier, le contenu et l’inbound deviennent les canaux principaux) ; AI Act art. 50 depuis le 02/08/2026 (étiquetage des images virtuelles et des assistants IA) ; DPE 2026 (coefficient 1,9) ; facturation électronique.\r
\r
### 1.1 Top 25 : fort impact, faible effort (P0–P1, effort S/M, 3 max par thème)\r
\r
| # | ID | Idée | Thème | Phase | Effort | Impact |\r
|---|---|---|---|---|---|---|\r
| 1 | NX-005 | Simulation de reclassement DPE 2026 | Parcours vendeur D1–D5 | P0 | S | 5 |\r
| 2 | NX-007 | Pack « RDV prêt » envoyé la veille à 18 h | Parcours vendeur D1–D5 | P0 | S | 5 |\r
| 3 | NX-017 | Engagements pris pendant le RDV listés | Parcours vendeur D1–D5 | P0 | S | 5 |\r
| 4 | NX-026 | L1 remerciement prêt dans l’heure | Livrables L1–L9 | P0 | S | 5 |\r
| 5 | NX-041 | L9 statuts absent, non applicable, expiré | Livrables L1–L9 | P0 | S | 5 |\r
| 6 | NX-055 | Financement déclaré, vérifié et daté | Acquéreurs & matching | P0 | S | 5 |\r
| 7 | NX-114 | Bascule de la pige téléphonique vers le courrier | Prospection & territoire | P0 | S | 5 |\r
| 8 | NX-152 | Dépôt de pièces par lien ciblé | Portail client | P0 | S | 5 |\r
| 9 | NX-186 | Mandats proches d’expiration | Pilotage agence & réseau | P0 | S | 5 |\r
| 10 | NX-205 | Niveaux d’autonomie A / V / P visibles | Automatisations | P0 | S | 5 |\r
| 11 | NX-208 | Fenêtres calmes et horaires métier | Automatisations | P0 | S | 5 |\r
| 12 | NX-210 | Conditions d’arrêt métier | Automatisations | P0 | S | 5 |\r
| 13 | NX-224 | Exécution en un geste après validation | IA & copilote | P0 | S | 5 |\r
| 14 | NX-238 | Distinction visuelle fait / suggestion IA | IA & copilote | P0 | S | 5 |\r
| 15 | NX-285 | Créneaux légaux d’appel et compteur 4/30 jours | Conformité | P0 | S | 5 |\r
| 16 | NX-286 | Retrait de consentement en un geste | Conformité | P0 | S | 5 |\r
| 17 | NX-288 | Étiquette « image virtuelle » incrustée | Conformité | P0 | S | 5 |\r
| 18 | NX-334 | Palette de commandes ⌘K | UX, design & motion | P0 | S | 5 |\r
| 19 | NX-345 | Annulation possible pendant 6 secondes | UX, design & motion | P0 | S | 5 |\r
| 20 | NX-359 | Pilote Antibes de 60 jours mesuré | Croissance & monétisation | P0 | S | 5 |\r
| 21 | NX-360 | Offre Surcouche à 49 € par siège | Croissance & monétisation | P0 | S | 5 |\r
| 22 | NX-376 | Authentification forte obligatoire | Sécurité | P0 | S | 5 |\r
| 23 | NX-383 | Révocation immédiate au départ d’un conseiller | Sécurité | P0 | S | 5 |\r
| 24 | NX-390 | Signalement d’erreur factuelle en un clic | Observabilité | P0 | S | 5 |\r
| 25 | NX-060 | Alerte nouvelle opportunité sous 10 minutes | Acquéreurs & matching | P1 | S | 5 |\r
\r
### 1.2 Dix paris différenciants\r
\r
1. **Agent post-RDV** (NX-229) — Aucun concurrent public ne produit L1–L9 depuis un dossier unique ; c’est la promesse « dans l’heure » qui fait signer.\r
2. **Contrôle de cohérence inter-livrables** (NX-042) — Rend vérifiable ce que les autres génèrent : une surface, un prix, un DPE identiques partout.\r
3. **Bascule de la pige téléphonique vers le courrier** (NX-114) — Transforme l’interdiction du 11/08/2026 en opportunité commerciale immédiate pour les agences.\r
4. **Campagnes voisinage déclenchées par événement** (NX-111) — Le courrier licite devient le canal principal ; NXT l’automatise à partir des jalons réels.\r
5. **Simulation de reclassement DPE 2026** (NX-005) — ~850 000 logements F/G peuvent gagner une classe : argument de RDV et de prospection unique.\r
6. **Mode surcouche Hektor, Modelo, Apimo** (NX-264) — Lève le premier frein des réseaux (migration) et positionne NXT en couche neutre face aux bundles.\r
7. **L9 extraction des PV d’AG avec citation de page** (NX-040) — La preuve page par page crée la confiance du vendeur et du notaire, là où l’IA générique hallucine.\r
8. **Audit « ventes manquées » à l’onboarding** (NX-116) — Démontre la valeur dès la première heure en chiffrant le manque à gagner caché du fichier.\r
9. **Simulation vocale D4 liée au dossier** (NX-166) — Le coaching sur le vrai dossier du lendemain n’existe nulle part en France.\r
10. **Aucun chiffre sans source calculée** (NX-242) — Garantie anti-hallucination opposable : chaque nombre est tracé jusqu’à sa source et son millésime.\r
\r
### 1.3 Dix quick wins design\r
\r
1. **Palette de commandes ⌘K** (NX-334) — déjà maquettée : ajouter le mode « Demander à NXT » et les actions récentes.\r
2. **Annulation possible pendant 6 secondes** (NX-345) — toast avec compte à rebours sur toute action automatique ; rassure sur l’autonomie.\r
3. **États vides qui proposent l’action suivante** (NX-344) — une phrase + un bouton par écran ; zéro écran mort pendant le pilote.\r
4. **Respect de la préférence « réduire les animations »** (NX-342) — un \`@media (prefers-reduced-motion)\` global et une bascule dans Réglages.\r
5. **Microcopie précise et bienveillante** (NX-351) — réécrire erreurs et confirmations ; gain de confiance immédiat.\r
6. **Squelette IA révélé champ par champ** (NX-339) — déjà maquetté : généraliser à tous les livrables du studio.\r
7. **Curseur avant/après accessible au clavier** (NX-341) — flèches gauche/droite, rôle \`slider\`, étiquette AI Act toujours visible.\r
8. **Navigation clavier j/k entre fiches** (NX-338) — glissement vertical de 120 ms entre dossiers, à la Linear.\r
9. **Thème Nuit avec transition circulaire** (NX-337) — View Transitions API, 600 ms, tokens Calcaire/Nuit déjà définis.\r
10. **« Pourquoi ce score » sur chaque indicateur** (NX-247) — un popover standard réutilisé par chaleur, matching et potentiel.\r
\r
## 2. Catalogue par thème\r
\r
### Parcours vendeur D1–D5 (25)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-001 | Brief relationnel D1 sourcé et daté | Le conseiller arrive au RDV avec les faits utiles, leurs sources et les homonymes écartés. | P0 | M | 5 | feature | maquette |\r
| NX-002 | Détection et levée d’homonymie | Évite de préparer un rendez-vous sur le profil public d’une autre personne. | P0 | S | 4 | compliance | proposé |\r
| NX-003 | Étude marché D2 avec millésime DVF visible | Chaque comparable affiche date, source et motif d’inclusion ou d’exclusion. | P0 | M | 5 | data | maquette |\r
| NX-004 | Radar quartier D3 avec statut des projets | Distingue projet annoncé, autorisé et livré pour ne rien promettre de faux au vendeur. | P1 | M | 4 | data | maquette |\r
| NX-005 | Simulation de reclassement DPE 2026 | Montre au vendeur si son DPE F ou G peut gagner une classe avec le coefficient 1,9. | P0 | S | 5 | feature | proposé |\r
| NX-006 | État des risques Géorisques pré-rempli | L’ERP est prêt avant le RDV, avec lien vers la source officielle et date de consultation. | P1 | S | 4 | data | proposé |\r
| NX-007 | Pack « RDV prêt » envoyé la veille à 18 h | Brief, carte, comparables et liste des manques arrivent en un seul écran. | P0 | S | 5 | automation | proposé |\r
| NX-008 | Check-list conditionnelle SCI, indivision, succession, viager | Les bonnes questions et pièces apparaissent selon la situation juridique du vendeur. | P0 | M | 5 | feature | proposé |\r
| NX-009 | Questionnaire préparatoire rempli par le vendeur | Le vendeur renseigne surfaces, travaux et contraintes avant la visite, sans ressaisie. | P1 | S | 4 | feature | proposé |\r
| NX-010 | Trois objectifs d’entretien proposés par RDV | Exclusivité, prix et calendrier guident la conversation et se mesurent ensuite. | P1 | S | 3 | feature | proposé |\r
| NX-011 | Banque d’objections préparée par dossier | Le conseiller révise les 5 objections probables et les réponses validées par l’agence. | P1 | S | 4 | feature | proposé |\r
| NX-012 | Découverte D5 progressive par niveaux de complétude | Les livrables se débloquent au fil de la saisie au lieu d’exiger une fiche complète. | P0 | M | 5 | ux | maquette |\r
| NX-013 | Débrief vocal structuré en champs validables | Deux minutes de dictée deviennent une fiche vendeur à valider champ par champ. | P0 | M | 5 | feature | maquette |\r
| NX-014 | Niveau de confiance par champ du dossier | Chaque donnée affiche vérifiée, déclarée ou à confirmer avant d’être partagée. | P0 | S | 4 | data | proposé |\r
| NX-015 | Capture photo guidée pièce par pièce | Une liste de prises de vue évite de revenir chez le vendeur pour une photo manquante. | P1 | S | 4 | feature | proposé |\r
| NX-016 | Relevé de surfaces avec contrôle Carrez | Alerte si la somme des pièces diverge de la surface déclarée au mandat. | P1 | M | 4 | feature | proposé |\r
| NX-017 | Engagements pris pendant le RDV listés | Chaque promesse orale devient une tâche datée visible du vendeur et du conseiller. | P0 | S | 5 | feature | proposé |\r
| NX-018 | Motivation et calendrier déclarés, jamais déduits | Le projet vendeur repose sur ses propres mots, sans profilage psychologique. | P0 | S | 4 | compliance | proposé |\r
| NX-019 | Décideurs et co-vendeurs identifiés dès le RDV | Aucun mandat ne bloque faute d’avoir associé l’indivisaire ou l’usufruitier. | P0 | S | 4 | feature | proposé |\r
| NX-020 | Score de complétude du dossier vendeur | Une jauge indique ce qui manque encore pour produire L6, L7 et L9. | P0 | S | 4 | ux | maquette |\r
| NX-021 | Comparaison des préparations successives | Le second RDV montre ce qui a changé depuis le premier : prix, marché, pièces. | P2 | S | 3 | feature | proposé |\r
| NX-022 | Dossier vente-achat lié | Relie la vente et le projet d’achat du même foyer pour synchroniser les calendriers. | P1 | M | 4 | feature | proposé |\r
| NX-023 | Préparation vendeur non résident | Prévoit visio, procuration, fuseau horaire et langue pour les propriétaires à l’étranger. | P1 | S | 4 | feature | proposé |\r
| NX-024 | Rail visuel du parcours D1→L9 | Le conseiller voit l’étape, le livrable en attente et le prochain geste en un coup d’œil. | P0 | M | 5 | ux | maquette |\r
| NX-025 | Fiche bien structurée avec DPE et caractéristiques | Surfaces, DPE, exposition et équipements sont saisis une fois et réutilisés partout. | P0 | M | 4 | feature | maquette |\r
\r
### Livrables L1–L9 (26)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-026 | L1 remerciement prêt dans l’heure | Le vendeur reçoit un mail personnalisé avant d’avoir appelé une agence concurrente. | P0 | S | 5 | feature | maquette |\r
| NX-027 | L1 avec prochaines étapes tirées de l’agenda | Les dates citées viennent du calendrier réel, jamais de la génération. | P0 | S | 4 | feature | proposé |\r
| NX-028 | L2 synthèse équipe en six lignes | L’équipe connaît le bien, le prix visé et les points sensibles sans ouvrir le dossier. | P0 | S | 4 | feature | maquette |\r
| NX-029 | L2 avis de valeur croisé à l’aveugle | Deux collègues donnent leur fourchette sans voir celle du conseiller avant validation de L7. | P1 | S | 4 | feature | proposé |\r
| NX-030 | L3 avant-première acquéreurs off-market | Les meilleurs acquéreurs voient le bien 72 h avant les portails, avec accord du vendeur. | P1 | M | 5 | feature | maquette |\r
| NX-031 | L4 kit social par jalon du mandat | Posts prêts pour nouveau mandat, baisse de prix, visite ouverte, compromis et vendu. | P1 | M | 4 | feature | maquette |\r
| NX-032 | L5 courrier voisinage « Aux occupants » | Lettre conforme avec QR d’opposition, prête à imprimer ou à router. | P1 | M | 5 | feature | maquette |\r
| NX-033 | L6 book de services modulaire | Le book n’assemble que les services réellement disponibles dans l’agence. | P0 | M | 5 | feature | maquette |\r
| NX-034 | L6 preuves locales automatiques | Le book cite les ventes de l’agence dans le secteur, avec délai et écart au prix affiché. | P1 | M | 5 | data | proposé |\r
| NX-035 | L7 estimation à fourchette et incertitude | Le vendeur comprend pourquoi la fourchette est large ou étroite et sur quels comparables. | P0 | M | 5 | feature | maquette |\r
| NX-036 | L7 scénarios de mise en vente | Compare prix ambitieux, prix marché et vente rapide avec un délai probable pour chacun. | P1 | M | 5 | feature | proposé |\r
| NX-037 | L7 trace des désaccords sur le prix | Le prix souhaité par le vendeur et l’avis de l’agent coexistent, motivés et datés. | P1 | S | 4 | feature | proposé |\r
| NX-038 | L8 home staging multi-styles respectant la structure | Trois styles proposés sans toucher aux ouvertures, aux volumes ni aux vues. | P0 | M | 5 | feature | maquette |\r
| NX-039 | L8 liste de travaux chiffrée et datée | Le vendeur voit le coût estimé des interventions simulées, avec la date des prix. | P2 | M | 3 | feature | proposé |\r
| NX-040 | L9 extraction des PV d’AG avec citation de page | Chaque point de vigilance renvoie à la page exacte du document source. | P0 | L | 5 | feature | maquette |\r
| NX-041 | L9 statuts absent, non applicable, expiré | Un document manquant n’est jamais présenté comme « aucun point bloquant ». | P0 | S | 5 | compliance | maquette |\r
| NX-042 | Contrôle de cohérence inter-livrables | Surface, prix, DPE et honoraires sont identiques dans les neuf livrables. | P0 | M | 5 | feature | proposé |\r
| NX-043 | Invalidation ciblée des livrables périmés | Modifier la surface ne régénère que les livrables qui en dépendent. | P1 | M | 4 | automation | proposé |\r
| NX-044 | Validation par lot dans le studio | Le conseiller approuve cinq livrables en une seule passe, champ par champ. | P0 | M | 4 | ux | maquette |\r
| NX-045 | Versions et différences de chaque livrable | On voit ce que l’IA a proposé et ce que le conseiller a corrigé. | P1 | S | 3 | feature | proposé |\r
| NX-046 | Traduction premium EN, IT, DE, RU | Les livrables partent dans la langue du vendeur ou de l’acquéreur international. | P0 | M | 5 | feature | proposé |\r
| NX-047 | Suivi d’ouverture des livrables | Le conseiller sait si le vendeur a ouvert l’estimation avant de l’appeler. | P1 | S | 4 | data | proposé |\r
| NX-048 | Gabarits de marque verrouillés par réseau | Logo, typographie et mentions légales ne peuvent pas être altérés localement. | P1 | M | 4 | feature | proposé |\r
| NX-049 | Book imprimé haut de gamme à la demande | Un book relié est commandé en un clic pour le second RDV d’une villa. | P2 | M | 3 | growth | proposé |\r
| NX-050 | Mini-site privé par dossier vendeur | Tous les livrables sont réunis sur une page élégante protégée par lien. | P1 | M | 4 | feature | proposé |\r
| NX-051 | Rapport vendeur hebdomadaire factuel | Visites, retours, vues portails et recommandations, sans aucun chiffre inventé. | P1 | M | 5 | automation | proposé |\r
\r
### Acquéreurs & matching (21)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-052 | Projet acquéreur indispensable / souhaité | Les critères non négociables filtrent, les critères souhaités ne font que classer. | P0 | M | 5 | feature | maquette |\r
| NX-053 | Score de matching expliqué par critère | L’agent voit pourquoi un acquéreur correspond à 87 % et ce qui manque. | P0 | M | 5 | feature | maquette |\r
| NX-054 | Zones de recherche dessinées sur carte | L’acquéreur trace son périmètre (Cap d’Antibes, Juan-les-Pins) au lieu de lister des communes. | P1 | M | 4 | ux | proposé |\r
| NX-055 | Financement déclaré, vérifié et daté | Une attestation de financement expirée fait baisser la priorité de l’acquéreur. | P0 | S | 5 | feature | proposé |\r
| NX-056 | Profil acquéreur international | Pays, devise, conseil fiscal et besoin de traduction sont notés dès la découverte. | P1 | S | 4 | feature | proposé |\r
| NX-057 | Requalification acquéreur tous les 60 jours | L’acquéreur confirme ou ajuste son projet en un clic, la base reste fraîche. | P1 | S | 4 | automation | proposé |\r
| NX-058 | Apprentissage des motifs de refus | Un acquéreur qui refuse trois biens avec vis-à-vis se voit proposer ce critère. | P2 | M | 4 | feature | proposé |\r
| NX-059 | Sélection collaborative entre co-acquéreurs | Le couple commente et classe les biens dans le même espace partagé. | P2 | M | 3 | feature | proposé |\r
| NX-060 | Alerte nouvelle opportunité sous 10 minutes | Les acquéreurs chauds sont prévenus avant la concurrence. | P1 | S | 5 | automation | proposé |\r
| NX-061 | Anti-doublon de sollicitation inter-agences | Un acquéreur n’est pas contacté trois fois pour le même bien par le réseau. | P1 | M | 4 | compliance | proposé |\r
| NX-062 | Propriétaire du contact et partage tracé | Le partage d’un acquéreur entre agences suit une règle visible et journalisée. | P1 | M | 4 | feature | proposé |\r
| NX-063 | Comparateur de biens favoris | Prix au m², charges, DPE et distance à la mer côte à côte. | P2 | S | 3 | ux | proposé |\r
| NX-064 | Recherche inversée pour un acquéreur VIP | Le copilote fouille stock, off-market et mandats à venir pour un acquéreur prioritaire. | P1 | M | 5 | feature | proposé |\r
| NX-065 | Chasse off-market pour un acquéreur | Propose une lettre ciblée aux propriétaires du secteur recherché, dans le respect du RGPD. | P2 | L | 4 | growth | proposé |\r
| NX-066 | Suspension et réactivation d’une recherche | Une recherche en pause ne déclenche plus d’envoi mais reste en mémoire. | P1 | S | 3 | feature | proposé |\r
| NX-067 | Score de chaleur acquéreur explicable | Activité récente, visites et financement composent un score lisible. | P1 | S | 4 | data | maquette |\r
| NX-068 | Fiche projet acquéreur anonymisée | Présente le projet au vendeur sans divulguer l’identité de l’acquéreur. | P2 | S | 3 | feature | proposé |\r
| NX-069 | Pipeline acquéreurs par étape | Découverte, visites, offre, financement et acte affichés en colonnes. | P1 | S | 3 | ux | proposé |\r
| NX-070 | Références de ventes récentes dans le budget | Montre à l’acquéreur ce qui s’est vendu dans sa gamme et à quel prix. | P2 | S | 3 | data | proposé |\r
| NX-071 | Services d’installation pour acquéreurs étrangers | Propose écoles internationales, conciergerie et gestion de résidence secondaire. | P3 | M | 3 | growth | proposé |\r
| NX-072 | Fiche contact unifiée multi-rôles | Une même personne peut être vendeur, acquéreur et prescripteur sans doublon. | P0 | M | 5 | feature | maquette |\r
\r
### Visites (16)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-073 | Agenda équipe avec types de RDV métier | Estimation, visite, signature et prospection sont colorées et filtrables. | P0 | M | 4 | ux | maquette |\r
| NX-074 | Prise de RDV de visite en libre-service | L’acquéreur choisit un créneau parmi les disponibilités du conseiller et du vendeur. | P1 | M | 4 | feature | proposé |\r
| NX-075 | Confirmation et rappel J-1 multilingue | Moins de visites manquées grâce à un rappel avec itinéraire et consignes d’accès. | P1 | S | 4 | automation | proposé |\r
| NX-076 | Bon de visite signé électroniquement | Le bon est signé sur mobile avant d’entrer, avec preuve horodatée. | P1 | S | 5 | compliance | proposé |\r
| NX-077 | Tournée de visites optimisée | Ordonne quatre visites selon le trafic et les contraintes des vendeurs. | P2 | M | 3 | feature | proposé |\r
| NX-078 | Compte rendu de visite vocal en 60 secondes | Le retour acquéreur est saisi en sortant, structuré en points forts et freins. | P1 | S | 5 | feature | proposé |\r
| NX-079 | Retour vendeur anonymisé et validé | Le vendeur reçoit la synthèse des visites sans données personnelles d’acquéreur. | P1 | S | 5 | feature | proposé |\r
| NX-080 | Visite à distance guidée en direct | Un acquéreur à Londres visite en visio avec l’agent sur place. | P2 | M | 4 | feature | proposé |\r
| NX-081 | Gestion des clés et des accès | Qui détient les clés, codes portail et alarme, avec historique de remise. | P2 | S | 3 | feature | proposé |\r
| NX-082 | Journée portes ouvertes avec inscriptions | Inscriptions, contrôle du financement et liste d’attente gérés automatiquement. | P2 | M | 3 | feature | proposé |\r
| NX-083 | Questionnaire acquéreur 2 h après la visite | Trois questions récoltent un avis sincère pendant que le souvenir est frais. | P1 | S | 4 | automation | proposé |\r
| NX-084 | Fiche visite consultable hors ligne | Plans, diagnostics et points clés restent disponibles sans réseau dans la villa. | P1 | S | 4 | feature | proposé |\r
| NX-085 | Détection des visites non débriefées | Une visite sans compte rendu sous 24 h crée automatiquement une tâche. | P1 | S | 4 | automation | proposé |\r
| NX-086 | Synthèse des objections récurrentes | Après cinq visites, le copilote dégage les objections dominantes et propose une action. | P1 | S | 5 | feature | proposé |\r
| NX-087 | Vérification d’identité pour biens prestige | L’identité du visiteur est contrôlée avant une visite de villa à plus de 3 M€. | P2 | M | 4 | compliance | proposé |\r
| NX-088 | Créneaux de visite approuvés par le vendeur | Le vendeur voit et accepte les créneaux sans appeler l’agence. | P1 | S | 4 | feature | proposé |\r
\r
### Offres, compromis & acte (20)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-089 | Rédaction d’offre selon modèle approuvé | L’offre d’achat est générée avec conditions, validité et financement. | P1 | M | 5 | feature | proposé |\r
| NX-090 | Registre des offres horodaté | Chaque offre, contre-offre et décision garde son auteur et son heure. | P1 | S | 5 | compliance | maquette |\r
| NX-091 | Comparateur d’offres pour le vendeur | Prix net, conditions suspensives, financement et délai présentés côte à côte. | P1 | M | 5 | feature | proposé |\r
| NX-092 | Preuve de transmission de toutes les offres | Trace que chaque offre reçue a bien été présentée au vendeur. | P1 | S | 4 | compliance | proposé |\r
| NX-093 | Alerte offre proche d’expiration | Le conseiller est prévenu 24 h avant la fin de validité d’une offre. | P1 | S | 4 | automation | proposé |\r
| NX-094 | Pipeline transaction mandat → acte | Jalons, responsables et échéances visibles par toutes les parties. | P0 | M | 5 | feature | maquette |\r
| NX-095 | Conditions suspensives avec compte à rebours | Prêt, permis, préemption : chaque échéance a un propriétaire et une date. | P1 | S | 5 | feature | proposé |\r
| NX-096 | Espace partagé avec le notaire | Le notaire accède aux seules pièces utiles et dépose le projet d’acte. | P1 | M | 5 | feature | proposé |\r
| NX-097 | Check-list avant signature du compromis | Diagnostics, pièces copro et état civil sont complets le jour J. | P1 | S | 5 | feature | proposé |\r
| NX-098 | Suivi du délai de rétractation SRU | Les 10 jours sont calculés à partir de la notification réelle. | P1 | S | 4 | compliance | proposé |\r
| NX-099 | Suivi du prêt avec le courtier invité | Le courtier met à jour l’avancement du financement directement dans le dossier. | P2 | M | 4 | feature | proposé |\r
| NX-100 | Suivi du droit de préemption urbain | La DIA et son délai de deux mois sont surveillés automatiquement. | P1 | S | 4 | feature | proposé |\r
| NX-101 | Questionnaire notaire pré-rempli | Le dossier transmis au notaire est complet dès le premier envoi. | P1 | M | 4 | feature | proposé |\r
| NX-102 | Prévision probabiliste de la date d’acte | Estime la date réelle de signature selon l’avancement des jalons. | P2 | M | 3 | data | proposé |\r
| NX-103 | Transactions en danger | Signale les dossiers dont un jalon glisse de plus de 7 jours. | P1 | S | 5 | automation | proposé |\r
| NX-104 | Analyse des ventes abandonnées | Classe les causes d’échec : financement, diagnostic, rétractation, prix. | P2 | S | 3 | data | proposé |\r
| NX-105 | Créneau de signature commun à toutes les parties | Trouve un rendez-vous compatible vendeur, acquéreur et deux notaires. | P2 | M | 3 | feature | proposé |\r
| NX-106 | Check-list de remise des clés | Relevés de compteurs, clés et documents remis sont tracés à l’acte. | P2 | S | 3 | feature | proposé |\r
| NX-107 | Demande d’avis et de recommandation J+30 | Un mois après l’acte, le client satisfait est invité à recommander l’agence. | P1 | S | 4 | growth | proposé |\r
| NX-108 | Archivage probatoire du dossier clôturé | Le dossier est scellé, horodaté et conservé selon la durée légale. | P1 | M | 4 | compliance | proposé |\r
\r
### Prospection & territoire (22)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-109 | Carte de prospection DVF et mandats agence | Visualise les rues à forte rotation et les ventes réalisées par l’agence. | P1 | M | 5 | feature | maquette |\r
| NX-110 | Signaux vendeurs licites et expliqués | Durée de détention, DPE reclassé et ventes voisines créent une piste motivée. | P1 | M | 5 | feature | maquette |\r
| NX-111 | Campagnes voisinage déclenchées par événement | Nouveau mandat, vente ou DPE publié génèrent une lettre de quartier. | P1 | M | 5 | automation | proposé |\r
| NX-112 | Routage postal intégré avec coût affiché | Impression, affranchissement et suivi sans quitter l’application. | P2 | L | 4 | feature | proposé |\r
| NX-113 | Liste d’opposition réseau partagée | Une opposition reçue par une agence s’applique immédiatement à toutes. | P0 | M | 5 | compliance | proposé |\r
| NX-114 | Bascule de la pige téléphonique vers le courrier | Les fichiers de pige sans consentement deviennent des campagnes postales licites. | P0 | S | 5 | growth | proposé |\r
| NX-115 | Page d’estimation en ligne de l’agence | Capte des vendeurs entrants avec une estimation honnête et une prise de RDV. | P1 | M | 5 | growth | proposé |\r
| NX-116 | Audit « ventes manquées » à l’onboarding | Croise DVF et CRM pour montrer les vendeurs connus partis chez un concurrent. | P1 | M | 5 | growth | proposé |\r
| NX-117 | Journée sans RDV transformée en plan d’action | Propose une tournée de boîtage et cinq relances consenties prioritaires. | P1 | S | 4 | automation | proposé |\r
| NX-118 | Boîtage terrain avec suivi volontaire | Rues couvertes, nombre de lettres et retours sont mesurés. | P2 | M | 3 | feature | proposé |\r
| NX-119 | Veille des nouveaux DPE ADEME du secteur | Repère les DPE F ou G récemment établis, souvent signe d’un projet de vente. | P2 | M | 4 | data | proposé |\r
| NX-120 | Veille des permis de construire et divisions | Les permis déposés signalent des projets de vente ou d’achat dans le secteur. | P2 | M | 3 | data | proposé |\r
| NX-121 | Anniversaire d’achat des anciens clients | Rappelle aux anciens acquéreurs l’évolution de leur quartier 5 ans après. | P1 | S | 4 | automation | proposé |\r
| NX-122 | Suivi des prescripteurs locaux | Notaires, gardiens et conciergeries : apports d’affaires et remerciements tracés. | P1 | S | 4 | feature | proposé |\r
| NX-123 | Cercle de propriétaires prestige sur consentement | Fiches relationnelles de propriétaires alimentées uniquement par leur accord. | P2 | M | 4 | feature | proposé |\r
| NX-124 | Secteurs attribués par conseiller | Chaque rue a un responsable, ce qui évite la double prospection. | P1 | S | 4 | feature | proposé |\r
| NX-125 | Pages quartier SEO mises à jour automatiquement | Une page par quartier reprend les ventes et projets récents de l’agence. | P2 | M | 4 | growth | proposé |\r
| NX-126 | Visibilité dans les assistants IA (GEO, llms.txt) | Les biens et l’agence deviennent citables par ChatGPT, Claude et Gemini. | P2 | M | 4 | growth | proposé |\r
| NX-127 | Réponses aux avis Google proposées | Le conseiller valide une réponse personnalisée à chaque nouvel avis. | P1 | S | 4 | growth | proposé |\r
| NX-128 | Score de potentiel par rue | Combine rotation, prix et ancienneté de détention pour prioriser la prospection. | P2 | M | 4 | data | proposé |\r
| NX-129 | Événements privés de l’agence | Invitations, inscriptions et suivi des contacts d’une soirée vernissage. | P3 | M | 2 | growth | proposé |\r
| NX-130 | Partenariats yachting, golf et conciergerie | Suivi des contacts apportés par les partenaires du luxe local. | P3 | S | 3 | growth | proposé |\r
\r
### Marketing & diffusion (19)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-131 | Annonce maître déclinée par portail | Une seule source de vérité adaptée à chaque portail généraliste et luxe. | P1 | M | 5 | feature | proposé |\r
| NX-132 | Multidiffusion via passerelle | Publication et retrait sur tous les portails en un clic. | P2 | L | 4 | feature | proposé |\r
| NX-133 | Diffusion sur portails internationaux luxe | Les villas atteignent les acheteurs étrangers via les portails spécialisés. | P2 | M | 4 | growth | proposé |\r
| NX-134 | Retouche photo technique sans tromperie | Redressement, lumière et ciel corrigés sans modifier les caractéristiques du bien. | P1 | M | 4 | feature | proposé |\r
| NX-135 | Vidéo verticale automatique de 30 secondes | Une vidéo prête pour Reels et Stories est générée depuis photos et annonce. | P1 | M | 4 | feature | proposé |\r
| NX-136 | Brochure et fiche vitrine imprimables | Fiche vitrine et brochure A4 sont produites depuis le même dossier. | P1 | S | 4 | feature | proposé |\r
| NX-137 | Calendrier éditorial social de l’agence | Planifie un mois de posts biens, quartier et ventes réalisées. | P2 | M | 3 | feature | proposé |\r
| NX-138 | Publicité sociale ciblée avec rapport vendeur | Une campagne lancée sur un bien montre ses résultats réels au vendeur. | P2 | M | 4 | growth | proposé |\r
| NX-139 | Newsletter acquéreurs segmentée | Envoi mensuel des nouveautés selon les critères de chaque abonné. | P2 | M | 3 | feature | proposé |\r
| NX-140 | Attribution des contacts aux annonces | Chaque lead entrant est rattaché à son portail et à son annonce. | P1 | S | 4 | data | proposé |\r
| NX-141 | Statistiques portails réellement connectées | Vues, contacts et favoris sont importés, jamais estimés. | P1 | M | 4 | data | proposé |\r
| NX-142 | Arrêt coordonné des supports après compromis | Tous les supports passent « sous compromis » le même jour. | P1 | S | 4 | automation | proposé |\r
| NX-143 | Visite 3D et plans liés à l’annonce | Matterport et plans sont rattachés au bien et repris dans chaque support. | P2 | S | 3 | feature | proposé |\r
| NX-144 | Textes alternatifs des photos publiées | Chaque photo diffusée a une description lisible par les lecteurs d’écran. | P2 | S | 2 | ux | proposé |\r
| NX-145 | Diffusion discrète off-market par lien nominatif | Partage restreint, filigrané au nom du destinataire et expirant. | P1 | M | 5 | feature | proposé |\r
| NX-146 | Filigrane et protection des photos | Limite la réutilisation des photos par des concurrents ou des fraudeurs. | P2 | S | 3 | feature | proposé |\r
| NX-147 | Test A/B des titres d’annonce | Compare deux accroches sur un même bien et mesure les contacts obtenus. | P3 | M | 3 | growth | proposé |\r
| NX-148 | Bibliothèque de campagnes réseau | Les agences reprennent une campagne validée par le siège en quelques clics. | P2 | M | 3 | feature | proposé |\r
| NX-149 | Panneau « À vendre » avec QR traçable | Le panneau renvoie vers le mini-site du bien et compte les scans. | P2 | S | 3 | growth | proposé |\r
\r
### Portail client (16)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-150 | Portail vendeur sous marque agence | Le vendeur suit visites, offres, documents et actions en temps réel. | P1 | L | 5 | feature | proposé |\r
| NX-151 | Fil d’activité vendeur avec preuves | Chaque action de l’agence apparaît avec sa date et sa preuve. | P1 | M | 5 | feature | proposé |\r
| NX-152 | Dépôt de pièces par lien ciblé | Le vendeur dépose le PV d’AG demandé sans créer de compte. | P0 | S | 5 | feature | proposé |\r
| NX-153 | Validation vendeur des médias et textes | Le vendeur approuve photos et annonce avant toute diffusion. | P1 | S | 4 | feature | proposé |\r
| NX-154 | Signature électronique dans le portail | Mandat, avenant de prix et bons sont signés sans déplacement. | P1 | M | 5 | feature | proposé |\r
| NX-155 | Portail acquéreur de la sélection à l’acte | L’acquéreur suit sélection, visites, offres et étapes jusqu’à la signature. | P2 | L | 4 | feature | proposé |\r
| NX-156 | Accès invités notaire, courtier, diagnostiqueur | Accès limité dans le temps et au seul périmètre utile. | P1 | M | 4 | feature | proposé |\r
| NX-157 | Messagerie sécurisée par dossier | Les échanges restent au dossier au lieu d’être dispersés dans les messageries. | P2 | M | 4 | feature | proposé |\r
| NX-158 | Portail vendeur multilingue | Le vendeur suisse ou britannique suit sa vente dans sa langue. | P1 | S | 4 | feature | proposé |\r
| NX-159 | Journal des preuves de diffusion | Le vendeur voit captures d’annonces publiées, dates et portails. | P1 | S | 4 | feature | proposé |\r
| NX-160 | Réservation d’un point d’étape par le vendeur | Le vendeur réserve un créneau dans l’agenda du conseiller. | P2 | S | 3 | feature | proposé |\r
| NX-161 | Correction des données par le client | Le client signale une erreur, tracée puis validée par le conseiller. | P1 | S | 3 | compliance | proposé |\r
| NX-162 | Droits différenciés par co-vendeur | Chaque indivisaire accède au dossier avec ses propres droits. | P1 | M | 4 | feature | proposé |\r
| NX-163 | Notifications client configurables | Le client choisit canal et fréquence : email, SMS ou WhatsApp. | P1 | S | 3 | ux | proposé |\r
| NX-164 | Satisfaction mesurée à chaque étape | Mesure la satisfaction après estimation, mandat et acte. | P2 | S | 3 | data | proposé |\r
| NX-165 | Portail installable en application web | Le portail s’installe sur le téléphone sans passer par un store. | P2 | M | 3 | ux | proposé |\r
\r
### Coaching & formation (16)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-166 | Simulation vocale D4 liée au dossier | Le conseiller répète son RDV face à un vendeur simulé avec les vraies objections. | P1 | L | 5 | feature | maquette |\r
| NX-167 | Grille de feedback publiée et observable | Le feedback évalue des comportements, jamais la personnalité. | P1 | S | 4 | feature | maquette |\r
| NX-168 | Feedback cité dans la transcription | Chaque conseil renvoie au passage exact de la simulation. | P1 | M | 4 | feature | proposé |\r
| NX-169 | Simulations privées par défaut | Les entraînements restent privés sauf partage volontaire au manager. | P0 | S | 4 | compliance | proposé |\r
| NX-170 | Parcours d’intégration du nouveau conseiller | Trente jours de modules, simulations et premiers dossiers accompagnés. | P2 | M | 4 | feature | proposé |\r
| NX-171 | Scénarios réseau avec variantes locales | Le siège publie les scénarios, l’agence les adapte au marché d’Antibes. | P2 | M | 3 | feature | proposé |\r
| NX-172 | Micro-entraînement de 5 minutes avant RDV | Une objection ciblée à répéter juste avant d’entrer chez le vendeur. | P1 | S | 4 | feature | proposé |\r
| NX-173 | Analyse des appels enregistrés avec accord | Les appels consentis donnent un retour sur l’écoute et la qualité des questions. | P2 | L | 4 | feature | proposé |\r
| NX-174 | Plan de progression personnel | Trois axes, exercices et date de revue choisis par le conseiller. | P2 | S | 3 | feature | proposé |\r
| NX-175 | Bibliothèque d’extraits de RDV réussis | Des moments clés anonymisés et approuvés servent d’exemples au réseau. | P2 | M | 3 | feature | proposé |\r
| NX-176 | Coaching manager suggéré par les tendances | Propose une session quand le taux d’exclusivité baisse sur 8 semaines. | P2 | S | 4 | automation | proposé |\r
| NX-177 | Entraînement en langue étrangère | Simulations en anglais ou en italien pour la clientèle internationale. | P2 | M | 4 | feature | proposé |\r
| NX-178 | Quiz réglementaire ALUR, LCB-FT, démarchage | Valide les connaissances exigées avant les situations à risque. | P2 | S | 3 | compliance | proposé |\r
| NX-179 | Suivi des heures de formation continue | Compte les 42 heures sur 3 ans exigées pour le renouvellement de la carte. | P2 | S | 3 | compliance | proposé |\r
| NX-180 | Contestation du feedback par le conseiller | Le conseiller peut annoter ou contester une évaluation. | P2 | S | 2 | feature | proposé |\r
| NX-181 | Défis d’équipe hebdomadaires | Un objectif collectif, par exemple cinq exclusivités, avec progression visible. | P3 | S | 2 | growth | proposé |\r
\r
### Pilotage agence & réseau (22)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-182 | Tableau de bord du jour de l’agence | CA signé, mandats, temps gagné et transformation réunis en un écran. | P0 | M | 5 | feature | maquette |\r
| NX-183 | Entonnoir estimation → mandat → vente | Taux de passage par étape et par conseiller sur la période choisie. | P1 | M | 5 | data | maquette |\r
| NX-184 | Délai RDV → suivi validé, médiane et p90 | Mesure la réactivité réelle après chaque rendez-vous vendeur. | P1 | S | 5 | data | proposé |\r
| NX-185 | Prévision de CA pondérée | CA attendu par mois selon la probabilité de chaque transaction. | P1 | M | 5 | data | proposé |\r
| NX-186 | Mandats proches d’expiration | Liste des mandats à renouveler dans les 30 jours avec leur bilan. | P0 | S | 5 | automation | proposé |\r
| NX-187 | Taux d’exclusivité par conseiller | Suit la part de mandats exclusifs, levier clé du haut de gamme. | P1 | S | 4 | data | proposé |\r
| NX-188 | Réunion commerciale préparée | Ordre du jour, dossiers bloqués et décisions converties en tâches. | P1 | M | 4 | feature | proposé |\r
| NX-189 | Console réseau hiérarchique | Réseau, région, agence et équipe avec agrégats comparables. | P2 | L | 4 | feature | proposé |\r
| NX-190 | Comparaison contextualisée entre agences | Compare à marché équivalent pour éviter les jugements injustes. | P2 | M | 4 | data | proposé |\r
| NX-191 | Adoption par fonctionnalité et par cohorte | Montre quelles agences utilisent vraiment les livrables. | P1 | S | 4 | data | proposé |\r
| NX-192 | Qualité des dossiers par agence | Complétude, sources et pièces manquantes mesurées chaque semaine. | P1 | S | 4 | data | proposé |\r
| NX-193 | Objectifs négociés et suivis | Objectifs annuels déclinés par mois avec écart expliqué. | P2 | S | 3 | feature | proposé |\r
| NX-194 | Rapport de direction prêt à commenter | Un rapport mensuel avec faits, écarts et questions ouvertes. | P2 | M | 4 | feature | proposé |\r
| NX-195 | Stock et âge moyen des mandats | Repère les biens qui vieillissent et la cause probable. | P1 | S | 4 | data | proposé |\r
| NX-196 | Fil d’activité de l’agence | Succès et alertes de l’équipe s’affichent en temps réel. | P0 | S | 3 | ux | maquette |\r
| NX-197 | Coût et marge par dossier vendeur validé | Rapproche coûts IA, images, courrier et honoraires encaissés. | P1 | M | 4 | data | proposé |\r
| NX-198 | Valorisation des progrès plutôt que palmarès | Met en avant les progrès individuels au lieu d’un classement punitif. | P2 | S | 2 | ux | proposé |\r
| NX-199 | Part de marché locale de l’agence | Part de l’agence dans les ventes DVF de chaque secteur. | P2 | M | 4 | data | proposé |\r
| NX-200 | Délégation et intérim de direction | Un directeur absent délègue ses validations pour une période définie. | P1 | S | 3 | feature | proposé |\r
| NX-201 | Déploiement par vagues avec agences témoins | Mesure l’effet réel de NXT entre agences pilotes et témoins. | P2 | M | 4 | data | proposé |\r
| NX-202 | Alertes de dérive d’activité | Signale une baisse anormale d’activité ou de qualité sur 4 semaines. | P2 | S | 3 | automation | proposé |\r
| NX-203 | Export financier pour la direction | Honoraires encaissés, prévisionnels et rétrocessions exportés. | P2 | M | 3 | data | proposé |\r
\r
### Automatisations (17)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-204 | Catalogue de 100 routines métier | Le conseiller active une routine éprouvée au lieu de la construire. | P0 | M | 5 | automation | maquette |\r
| NX-205 | Niveaux d’autonomie A / V / P visibles | Chaque routine indique si elle agit seule, attend validation ou propose. | P0 | S | 5 | ux | maquette |\r
| NX-206 | Constructeur de routine avec aperçu | Simule une routine sur un dossier réel avant de l’activer. | P1 | L | 4 | automation | proposé |\r
| NX-207 | Journal d’exécution par routine | Qui, quand, sur quel dossier et avec quel résultat. | P0 | M | 5 | automation | maquette |\r
| NX-208 | Fenêtres calmes et horaires métier | Aucune notification client le dimanche ou après 20 h. | P0 | S | 5 | automation | proposé |\r
| NX-209 | Déduplication des actions entre routines | Un même mail n’est jamais envoyé deux fois par deux routines. | P0 | M | 5 | automation | proposé |\r
| NX-210 | Conditions d’arrêt métier | Une relance s’arrête à la signature, au refus ou à l’opposition. | P0 | S | 5 | automation | proposé |\r
| NX-211 | Plafonds de coût et de volume | Une routine ne peut pas dépasser son budget mensuel. | P0 | S | 4 | automation | proposé |\r
| NX-212 | Centre des échecs et reprise sécurisée | Les exécutions bloquées se rejouent sans créer de doublon. | P0 | M | 4 | automation | proposé |\r
| NX-213 | Versions et retour arrière des routines | Une modification malheureuse se défait en un clic. | P1 | S | 3 | automation | proposé |\r
| NX-214 | Mesure d’utilité par routine | Temps gagné, taux d’acceptation et désactivations suivis par routine. | P1 | S | 4 | data | proposé |\r
| NX-215 | Routines héritées du réseau | Le siège publie, l’agence active et ajuste dans les limites permises. | P2 | M | 4 | automation | proposé |\r
| NX-216 | Déclencheurs géolocalisés volontaires | Le débrief démarre quand le conseiller quitte l’adresse du RDV. | P1 | M | 4 | automation | proposé |\r
| NX-217 | Routine décrite en langage naturel | « Relance les vendeurs sans nouvelles depuis 10 jours » devient une règle. | P2 | L | 4 | automation | proposé |\r
| NX-218 | Bac à sable sur données de démonstration | Teste une routine sans toucher aux vrais clients. | P1 | S | 3 | automation | proposé |\r
| NX-219 | Pause d’urgence de tous les envois | Un interrupteur arrête toutes les actions sortantes de l’agence. | P0 | S | 5 | automation | proposé |\r
| NX-220 | Suggestion de routine selon les gestes répétés | Propose une routine quand un geste manuel se répète chaque semaine. | P2 | M | 3 | automation | proposé |\r
\r
### IA & copilote (27)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-221 | Brief du matin expliqué | Chaque action du jour est proposée avec son « pourquoi ». | P0 | M | 5 | feature | maquette |\r
| NX-222 | Copilote contextuel au dossier ouvert | Le copilote connaît le dossier affiché sans qu’on le lui décrive. | P0 | M | 5 | feature | maquette |\r
| NX-223 | File de validation unique | Tout ce que l’IA propose arrive au même endroit : approuver, modifier, rejeter. | P0 | M | 5 | ux | maquette |\r
| NX-224 | Exécution en un geste après validation | Le mail validé part, la tâche se crée, le livrable s’archive. | P0 | S | 5 | feature | maquette |\r
| NX-225 | Tâches générées et priorisées par l’IA | Les tâches créées par le copilote sont marquées et triées par échéance. | P0 | S | 4 | feature | maquette |\r
| NX-226 | Mémoire relationnelle par client | Le copilote retient les préférences déclarées : langue, canal, horaires. | P1 | M | 4 | feature | proposé |\r
| NX-227 | Mémoire des corrections du conseiller | Les reformulations récurrentes deviennent le style rédactionnel par défaut. | P2 | M | 4 | feature | proposé |\r
| NX-228 | Agent de préparation de RDV | Assemble D1–D3 seul dès qu’un RDV vendeur est créé. | P0 | L | 5 | automation | maquette |\r
| NX-229 | Agent post-RDV | Produit L1–L9 en parallèle et les présente prêts à valider. | P0 | L | 5 | automation | maquette |\r
| NX-230 | Agent transaction | Suit les jalons du compromis à l’acte et relance les pièces manquantes. | P1 | L | 5 | automation | proposé |\r
| NX-231 | Agent de qualification entrante 24/7 | Répond aux leads portails et WhatsApp puis passe la main à l’humain. | P1 | L | 4 | automation | proposé |\r
| NX-232 | Agent vocal entrant identifié comme IA | Prend les appels hors horaires en se présentant comme assistant IA. | P2 | L | 4 | feature | proposé |\r
| NX-233 | Détection des oublis | RDV sans suivi, mandat sans rapport, compromis sans pièce sont signalés. | P0 | M | 5 | automation | proposé |\r
| NX-234 | Résumé d’appel vers fiche et tâches | Un appel consenti devient une note structurée et deux tâches. | P1 | M | 4 | feature | proposé |\r
| NX-235 | Questions sur documents avec citations | Le copilote répond sur un règlement de copropriété en citant la page. | P1 | M | 5 | feature | proposé |\r
| NX-236 | Questions chiffrées sur ses propres données | « Combien de mandats exclusifs ce trimestre ? » est répondu avec le calcul visible. | P1 | M | 4 | feature | proposé |\r
| NX-237 | Dictée mains libres en voiture | Le conseiller dicte son débrief en conduisant, sans regarder l’écran. | P1 | M | 4 | feature | maquette |\r
| NX-238 | Distinction visuelle fait / suggestion IA | Les contenus générés restent marqués jusqu’à leur validation. | P0 | S | 5 | compliance | proposé |\r
| NX-239 | Serveur MCP NXT | Le conseiller interroge ses dossiers depuis Claude ou ChatGPT, sous contrôle. | P2 | L | 4 | data | proposé |\r
| NX-240 | Routage des modèles selon la tâche | Modèle rapide pour le tri, modèle expert pour l’estimation. | P1 | M | 3 | data | proposé |\r
| NX-241 | Évaluation sur dossiers de référence | Chaque nouvelle version IA est testée sur 50 dossiers témoins avant déploiement. | P1 | M | 4 | data | proposé |\r
| NX-242 | Aucun chiffre sans source calculée | Tout nombre d’un livrable provient d’un calcul déterministe tracé. | P0 | M | 5 | compliance | proposé |\r
| NX-243 | Copilote multilingue | Le copilote répond et rédige en anglais, italien, allemand et russe. | P1 | S | 4 | feature | proposé |\r
| NX-244 | Coût et délai affichés avant génération lourde | Staging, vidéo ou campagne : le prix est connu avant de lancer. | P1 | S | 4 | ux | proposé |\r
| NX-245 | Agent de veille marché hebdomadaire | Résume ventes, baisses de prix et nouveaux concurrents du secteur. | P2 | M | 4 | automation | proposé |\r
| NX-246 | Stratégie de contre-offre argumentée | Propose une réponse à une offre basse appuyée sur les comparables. | P2 | M | 4 | feature | proposé |\r
| NX-247 | « Pourquoi ce score » sur chaque indicateur | Tout score de chaleur, matching ou potentiel s’ouvre sur ses facteurs. | P1 | S | 4 | ux | proposé |\r
\r
### Mobile terrain & hors ligne (16)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-248 | Application terrain utilisable à une main | Les actions clés restent accessibles au pouce pendant une visite. | P1 | L | 5 | ux | proposé |\r
| NX-249 | Dossiers du jour disponibles hors ligne | Les dossiers des RDV du jour sont téléchargés automatiquement le matin. | P1 | L | 5 | feature | proposé |\r
| NX-250 | Synchronisation avec résolution de conflits | Une donnée saisie hors ligne ne remplace pas en silence une valeur plus récente. | P1 | M | 4 | data | proposé |\r
| NX-251 | Scan de documents avec OCR | Taxe foncière ou DPE photographiés deviennent des champs à valider. | P1 | M | 4 | feature | proposé |\r
| NX-252 | Relevé des pièces par LiDAR | Les surfaces sont mesurées au téléphone et versées au dossier. | P3 | L | 3 | feature | proposé |\r
| NX-253 | Notes rapides datées et localisées | Une note prise devant la villa est rattachée au bon dossier. | P1 | S | 3 | feature | proposé |\r
| NX-254 | Widget « prochain RDV » sur l’écran d’accueil | Adresse, brief et itinéraire accessibles en un geste. | P2 | S | 3 | ux | proposé |\r
| NX-255 | Heure de départ conseillée selon le trafic | Prévient quand partir pour arriver à l’heure malgré les bouchons. | P2 | S | 3 | feature | proposé |\r
| NX-256 | Mode visite silencieux et confidentiel | Masque notifications et informations sensibles pendant une visite. | P1 | S | 4 | ux | proposé |\r
| NX-257 | Appareil photo avec gabarits de cadrage | Des guides de composition garantissent des photos homogènes. | P2 | M | 3 | feature | proposé |\r
| NX-258 | Débrief lancé depuis la montre | Le conseiller démarre la dictée du débrief depuis son poignet. | P3 | M | 2 | feature | proposé |\r
| NX-259 | Envoi d’un bien à un acquéreur en deux gestes | La fiche part depuis le terrain sans revenir au bureau. | P1 | S | 4 | feature | proposé |\r
| NX-260 | Signature du mandat sur tablette en RDV | Le mandat est signé sur place avec pièce d’identité scannée. | P1 | M | 5 | feature | proposé |\r
| NX-261 | Signalement d’incident dans un bien | Dégât ou alarme crée une alerte et prévient le propriétaire. | P2 | S | 3 | feature | proposé |\r
| NX-262 | Kilométrage et frais saisis à la voix | Les déplacements alimentent automatiquement la note de frais. | P3 | S | 2 | feature | proposé |\r
| NX-263 | Notifications push regroupées et utiles | Seules les alertes importantes passent, regroupées par dossier. | P1 | S | 4 | ux | proposé |\r
\r
### Données & intégrations (20)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-264 | Mode surcouche Hektor, Modelo, Apimo | NXT s’ajoute au CRM existant sans double saisie. | P0 | XL | 5 | data | proposé |\r
| NX-265 | Import CRM avec correspondance des champs | Migration assistée champ par champ avec rapport d’écarts. | P0 | L | 5 | data | proposé |\r
| NX-266 | Synchronisation agenda Google et Outlook | Un RDV créé dans l’agenda déclenche automatiquement la préparation. | P0 | M | 5 | data | maquette |\r
| NX-267 | Messagerie Gmail et Outlook reliée | Les mails clients sont rattachés au bon dossier automatiquement. | P1 | M | 4 | data | proposé |\r
| NX-268 | WhatsApp Business avec coût par message | Les échanges sont archivés au dossier et leur coût suivi. | P1 | M | 4 | data | proposé |\r
| NX-269 | DVF, cadastre et INSEE intégrés | Comparables et parcelles sont disponibles sans abonnement tiers. | P0 | M | 5 | data | maquette |\r
| NX-270 | DPE officiel ADEME retrouvé par adresse | Le DPE enregistré est rattaché au bien et à sa date de validité. | P0 | S | 4 | data | proposé |\r
| NX-271 | Urbanisme PLU et zonage consultés | Zonage et servitudes affichés avec la date de consultation. | P1 | M | 4 | data | proposé |\r
| NX-272 | Connecteur de signature électronique | Envoi, relance et récupération des documents signés sans ressaisie. | P1 | M | 5 | data | proposé |\r
| NX-273 | API publique documentée et webhooks | Le réseau connecte ses propres outils de manière fiable. | P2 | L | 4 | data | proposé |\r
| NX-274 | Connecteur téléphonie d’entreprise | Les appels sont journalisés au dossier, avec consentement. | P2 | M | 3 | data | proposé |\r
| NX-275 | Connecteur logiciel comptable | Les factures d’honoraires partent vers la comptabilité sans ressaisie. | P2 | M | 3 | data | proposé |\r
| NX-276 | Centre des connexions par agence | État, dernier succès et erreurs de chaque intégration. | P1 | S | 4 | data | maquette |\r
| NX-277 | Journal des conflits de synchronisation | Montre les écarts entre NXT et le CRM et qui doit trancher. | P1 | M | 4 | data | proposé |\r
| NX-278 | Export complet en formats ouverts | L’agence récupère toutes ses données à tout moment. | P0 | S | 4 | data | proposé |\r
| NX-279 | Dictionnaire métier partagé | Une seule définition de « mandat actif » pour tout le réseau. | P1 | S | 3 | data | proposé |\r
| NX-280 | Annonces concurrentes du secteur | Les biens en vente ailleurs alimentent l’analyse de positionnement. | P2 | M | 4 | data | proposé |\r
| NX-281 | Registre national des copropriétés | Numéro d’immatriculation et données du registre repris automatiquement. | P1 | S | 4 | data | proposé |\r
| NX-282 | Import Excel d’acquéreurs dédoublonné | Un fichier d’acquéreurs est fusionné sans créer de doublons. | P0 | S | 4 | data | proposé |\r
| NX-283 | Calendrier des jours fériés et vacances | Les routines respectent jours ouvrés et périodes locales. | P1 | S | 2 | data | proposé |\r
\r
### Conformité (24)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-284 | Registre de consentement par contact et canal | Preuve, finalité, date et expiration à un an conservées trois ans. | P0 | M | 5 | compliance | proposé |\r
| NX-285 | Créneaux légaux d’appel et compteur 4/30 jours | Le bouton d’appel se grise hors créneau légal ou quota atteint. | P0 | S | 5 | compliance | proposé |\r
| NX-286 | Retrait de consentement en un geste | Un « stop » oral saisi en une touche arrête toutes les sollicitations. | P0 | S | 5 | compliance | proposé |\r
| NX-287 | Contrôleur de mentions d’annonce bloquant | Honoraires TTC en %, DPE/GES et mention F/G vérifiés avant tout export. | P0 | M | 5 | compliance | proposé |\r
| NX-288 | Étiquette « image virtuelle » incrustée | L’étiquette AI Act est apposée sur chaque visuel généré ou modifié. | P0 | S | 5 | compliance | maquette |\r
| NX-289 | Métadonnées C2PA et IPTC sur les médias générés | Le marquage machine-lisible est intégré aux fichiers diffusés. | P1 | M | 4 | compliance | proposé |\r
| NX-290 | Mention « assistant IA » sur tout agent conversationnel | Le client sait toujours qu’il échange avec une IA. | P0 | S | 5 | compliance | proposé |\r
| NX-291 | Règles anti-tromperie du staging | Interdit d’effacer fissures et vis-à-vis ou de modifier les volumes. | P0 | M | 5 | compliance | proposé |\r
| NX-292 | Vigilance LCB-FT et déclaration Tracfin | Identification, évaluation du risque et alerte avant le compromis. | P1 | L | 5 | compliance | proposé |\r
| NX-293 | Contrôle PPE et gels d’avoirs | Les parties sont vérifiées contre les listes officielles. | P1 | M | 5 | compliance | proposé |\r
| NX-294 | Origine des fonds documentée | Les justificatifs d’apport sont demandés et conservés pour les montants élevés. | P1 | M | 5 | compliance | proposé |\r
| NX-295 | Registre des mandats électronique | Numérotation continue et inaltérable conforme à la loi Hoguet. | P0 | M | 5 | compliance | proposé |\r
| NX-296 | Durées de conservation et purge automatique | Les prospects inactifs depuis trois ans sont anonymisés. | P0 | M | 4 | compliance | proposé |\r
| NX-297 | Demandes de droits RGPD outillées | Accès, rectification et effacement traités dans le délai d’un mois. | P0 | M | 4 | compliance | proposé |\r
| NX-298 | Registre des traitements généré par agence | Le registre RGPD se construit à partir des usages réels. | P1 | S | 3 | compliance | proposé |\r
| NX-299 | Provenance de chaque fait au survol | Source, date, version et validateur s’affichent sur chaque donnée clé. | P0 | M | 5 | compliance | proposé |\r
| NX-300 | Validité des diagnostics recalculée | DPE, amiante, plomb et termites avec date d’expiration selon le type. | P0 | S | 5 | compliance | proposé |\r
| NX-301 | Information RGPD sur chaque courrier | Chaque lettre indique l’émetteur, l’origine des données et un QR d’opposition. | P0 | S | 5 | compliance | proposé |\r
| NX-302 | Mentions des annonces locatives | Les annonces de location respectent encadrement des loyers et arrêté de 2022. | P2 | S | 3 | compliance | proposé |\r
| NX-303 | Journal d’audit inaltérable | Toute décision assistée par l’IA peut être reconstituée. | P1 | M | 4 | compliance | proposé |\r
| NX-304 | Hébergement UE et sous-traitants IA déclarés | Données en UE, sans entraînement des modèles sur les données clients. | P0 | M | 5 | compliance | proposé |\r
| NX-305 | Carte professionnelle et garantie sur tous supports | Les mentions légales de l’agence sont à jour dans chaque livrable. | P1 | S | 3 | compliance | proposé |\r
| NX-306 | Analyse d’impact pour les traitements IA | Le dossier de conformité est prêt en cas de contrôle CNIL. | P1 | M | 3 | compliance | proposé |\r
| NX-307 | Facturation électronique conforme | Réception et émission des factures via une plateforme agréée. | P2 | M | 4 | compliance | proposé |\r
\r
### Facturation & commissions (14)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-308 | Prévision d’honoraires par transaction | Montant, répartition et date probable d’encaissement visibles. | P1 | S | 4 | feature | proposé |\r
| NX-309 | Partage de commission inter-agences | La clé de répartition est tracée quand deux agences coopèrent. | P2 | M | 4 | feature | proposé |\r
| NX-310 | Rétrocession des agents commerciaux | Calcule la part du mandataire selon son barème. | P2 | M | 4 | feature | proposé |\r
| NX-311 | Facture d’honoraires émise à l’acte | La facture part dès la confirmation de signature. | P2 | M | 4 | automation | proposé |\r
| NX-312 | Relance des honoraires impayés | Rappels progressifs au notaire ou au client. | P2 | S | 3 | automation | proposé |\r
| NX-313 | Barème d’honoraires versionné | Le barème affiché correspond toujours au barème appliqué. | P1 | S | 4 | compliance | proposé |\r
| NX-314 | Simulateur net vendeur | Le vendeur voit son net après honoraires et frais. | P1 | S | 4 | feature | proposé |\r
| NX-315 | Abonnement géré en libre-service | L’agence change d’offre, ajoute des sièges et télécharge ses factures. | P1 | M | 4 | growth | proposé |\r
| NX-316 | Facturation au dossier vendeur validé | Les volumes lourds sont facturés au résultat, pas au jeton. | P1 | M | 4 | growth | proposé |\r
| NX-317 | Crédits restitués en cas d’échec technique | Une génération ratée ne coûte rien à l’agence. | P1 | S | 3 | growth | proposé |\r
| NX-318 | Frais de campagne affectés au dossier | Affranchissement et publicité sont imputés au bien concerné. | P2 | S | 3 | feature | proposé |\r
| NX-319 | Tableau de commissions par conseiller | Chacun voit son CA, ses encaissements et sa part. | P2 | S | 3 | feature | proposé |\r
| NX-320 | Notes de frais rattachées aux dossiers | Kilométrage et dépenses sont liés au bien qui les a occasionnés. | P3 | S | 2 | feature | proposé |\r
| NX-321 | Export pour l’expert-comptable | Écritures d’honoraires prêtes à importer. | P2 | S | 3 | data | proposé |\r
\r
### Gestion locative & syndic (option) (12)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-322 | Location saisonnière haut de gamme | Calendrier, contrats et arrivées pour les villas louées à la semaine. | P3 | L | 3 | feature | proposé |\r
| NX-323 | Mandat de gestion locative | Baux, quittances et révisions de loyer suivis. | P3 | XL | 3 | feature | proposé |\r
| NX-324 | Numéro d’enregistrement meublé de tourisme | Le numéro est vérifié avant toute annonce saisonnière. | P3 | S | 3 | compliance | proposé |\r
| NX-325 | État des lieux numérique | Photos horodatées et signature sur tablette. | P3 | M | 3 | feature | proposé |\r
| NX-326 | Bailleur vendeur signalé au transactionnaire | Un propriétaire géré qui veut vendre est transmis à l’équipe vente. | P2 | S | 4 | growth | proposé |\r
| NX-327 | Alerte logements interdits à la location | Le bailleur d’un bien G ou F est prévenu, avec options travaux ou vente. | P2 | S | 4 | compliance | proposé |\r
| NX-328 | Portail propriétaire bailleur | Loyers, travaux et documents fiscaux en ligne. | P3 | L | 3 | feature | proposé |\r
| NX-329 | Demande du pré-état daté au syndic | Les pièces de copropriété sont réclamées automatiquement. | P2 | M | 4 | feature | proposé |\r
| NX-330 | Travaux votés et appels de fonds | Les travaux votés en AG sont reportés dans le dossier de vente. | P2 | S | 4 | data | proposé |\r
| NX-331 | Demandes d’intervention des locataires | Le locataire signale un incident, le gestionnaire assigne un artisan. | P3 | M | 2 | feature | proposé |\r
| NX-332 | Gardiennage de résidences secondaires | Passages, rapports photo et alertes pour propriétaires absents. | P3 | M | 3 | growth | proposé |\r
| NX-333 | Annuaire d’artisans et prestataires évalués | Les prestataires de confiance de l’agence sont centralisés. | P3 | S | 2 | feature | proposé |\r
\r
### UX, design & motion (25)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-334 | Palette de commandes ⌘K | Accès instantané à tout dossier, bien ou action au clavier. | P0 | S | 5 | ux | maquette |\r
| NX-335 | Titre d’accueil généré et cliquable | La phrase du jour résume la situation, chaque nom ouvre sa fiche. | P1 | S | 4 | ux | maquette |\r
| NX-336 | Kanban des dossiers en glisser-déposer | Faire avancer un dossier d’étape en un geste. | P0 | M | 4 | ux | maquette |\r
| NX-337 | Thème Nuit avec transition circulaire | Confort visuel en soirée pour le travail de back-office. | P1 | S | 3 | ux | proposé |\r
| NX-338 | Navigation clavier j/k entre fiches | Parcourir 80 dossiers sans toucher la souris. | P1 | S | 3 | ux | proposé |\r
| NX-339 | Squelette IA révélé champ par champ | L’attente d’une génération devient lisible et rassurante. | P0 | S | 4 | ux | maquette |\r
| NX-340 | Révélation sobre d’un livrable validé | La validation d’un livrable est marquée par un sceau discret. | P2 | S | 2 | ux | proposé |\r
| NX-341 | Curseur avant/après accessible au clavier | Le staging se compare à la souris, au doigt ou aux flèches. | P1 | S | 4 | ux | maquette |\r
| NX-342 | Respect de la préférence « réduire les animations » | Toutes les animations se désactivent proprement. | P0 | S | 4 | ux | proposé |\r
| NX-343 | Cellules éditables dans les listes | Statut ou prix se modifient directement dans le tableau. | P1 | M | 4 | ux | proposé |\r
| NX-344 | États vides qui proposent l’action suivante | Chaque écran vide indique le premier geste utile. | P0 | S | 4 | ux | proposé |\r
| NX-345 | Annulation possible pendant 6 secondes | Chaque action automatique est annulable depuis la notification. | P0 | S | 5 | ux | proposé |\r
| NX-346 | Densité d’affichage réglable | Confortable pour le terrain, compacte pour le back-office. | P2 | S | 2 | ux | proposé |\r
| NX-347 | Accessibilité WCAG 2.2 AA | Contrastes, focus visibles et lecteurs d’écran pris en charge. | P0 | M | 4 | ux | proposé |\r
| NX-348 | Carte radar des comparables | Les comparables s’allument au passage d’un balayage sur la carte. | P2 | M | 2 | ux | proposé |\r
| NX-349 | Fiche bien en cockpit visuel | Visites, offres, DPE et tâches flottent sur la photo du bien. | P2 | M | 3 | ux | proposé |\r
| NX-350 | Jauges segmentées d’objectifs | Les objectifs se remplissent segment par segment. | P2 | S | 2 | ux | proposé |\r
| NX-351 | Microcopie précise et bienveillante | Les messages disent quoi faire, jamais « erreur inconnue ». | P0 | S | 4 | ux | proposé |\r
| NX-352 | Onboarding par rôle en 5 minutes | Chaque rôle découvre ses trois gestes clés dès la première connexion. | P1 | M | 4 | ux | proposé |\r
| NX-353 | Espace de démonstration réaliste | Des dossiers fictifs d’Antibes permettent d’essayer sans risque. | P1 | S | 4 | growth | proposé |\r
| NX-354 | Landing animée « RDV → 9 livrables » | Le visiteur comprend le produit en 20 secondes de défilement. | P0 | M | 5 | ux | maquette |\r
| NX-355 | Démo interactive du CRM sur la landing | Le prospect manipule un vrai écran avant de demander une démo. | P1 | M | 4 | growth | maquette |\r
| NX-356 | Transitions de page qui gardent le contexte | Le passage d’une liste à une fiche conserve les repères visuels. | P2 | S | 2 | ux | proposé |\r
| NX-357 | Tableau de bord personnalisable | Chaque conseiller choisit ses widgets et leur ordre. | P2 | M | 3 | ux | proposé |\r
| NX-358 | Journal chronologique du dossier | Chaque action humaine ou IA apparaît dans l’historique du dossier. | P0 | S | 4 | ux | maquette |\r
\r
### Croissance & monétisation (16)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-359 | Pilote Antibes de 60 jours mesuré | Prouve le temps gagné et la conversion sur trois à cinq agences. | P0 | S | 5 | growth | proposé |\r
| NX-360 | Offre Surcouche à 49 € par siège | Permet d’entrer chez une agence sans migration de CRM. | P0 | S | 5 | growth | proposé |\r
| NX-361 | Calculateur de retour sur investissement | Le prospect saisit ses volumes et voit temps et CA gagnés. | P1 | S | 4 | growth | proposé |\r
| NX-362 | Parrainage entre agences | Un mois offert pour chaque agence parrainée qui démarre. | P2 | S | 3 | growth | proposé |\r
| NX-363 | Témoignages vidéo des agences pilotes | Une preuve sociale locale pour la Côte d’Azur. | P1 | S | 4 | growth | proposé |\r
| NX-364 | Place de marché de modèles et routines | Les réseaux partagent ou vendent leurs gabarits. | P3 | L | 3 | growth | proposé |\r
| NX-365 | Packs à l’usage pour vidéo, courrier et voix | L’agence paie les volumes lourds seulement quand elle en a besoin. | P2 | M | 3 | growth | proposé |\r
| NX-366 | Offre réseau avec console et SSO | Monétise la gouvernance auprès des franchises et groupes. | P2 | M | 5 | growth | proposé |\r
| NX-367 | Essai guidé sur un dossier réel | Le premier dossier vendeur est produit en 30 minutes. | P1 | M | 5 | growth | proposé |\r
| NX-368 | Programme d’ambassadeurs conseillers | Les meilleurs utilisateurs forment leurs pairs et sont reconnus. | P3 | S | 2 | growth | proposé |\r
| NX-369 | Extension Monaco et Riviera italienne | Multilingue et règles locales pour Menton, Monaco et la Ligurie. | P3 | XL | 3 | growth | proposé |\r
| NX-370 | Guides « vendre en 2026 » | Les guides démarchage et AI Act attirent les agences inquiètes. | P1 | S | 4 | growth | proposé |\r
| NX-371 | Présence aux salons et fédérations | Visibilité auprès des réseaux au moment du choix des outils. | P2 | S | 3 | growth | proposé |\r
| NX-372 | Score de santé client anti-résiliation | Détecte une agence qui décroche avant qu’elle ne résilie. | P2 | M | 4 | growth | proposé |\r
| NX-373 | Prix annoncé avant chaque génération payante | La confiance naît d’un coût connu à l’avance. | P1 | S | 3 | growth | proposé |\r
| NX-374 | Rapport de valeur trimestriel à l’agence | Temps gagné, mandats signés et livrables produits grâce à NXT. | P1 | S | 4 | growth | proposé |\r
\r
### Sécurité (12)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-375 | SSO et provisionnement SCIM | Les réseaux gèrent comptes et départs depuis leur annuaire. | P2 | M | 4 | compliance | proposé |\r
| NX-376 | Authentification forte obligatoire | Passkeys ou code à usage unique pour tous les comptes. | P0 | S | 5 | compliance | proposé |\r
| NX-377 | Permissions par action et par périmètre | Un assistant voit les pièces sans pouvoir exporter les contacts. | P0 | M | 5 | feature | proposé |\r
| NX-378 | Cloisonnement testé entre agences | Des tests automatiques garantissent qu’aucune agence ne voit les données d’une autre. | P0 | M | 5 | compliance | proposé |\r
| NX-379 | Chiffrement des pièces sensibles | Pièces d’identité et avis d’imposition sont chiffrés au repos. | P0 | M | 5 | compliance | proposé |\r
| NX-380 | Liens de partage expirants et révocables | Un lien envoyé au notaire cesse de fonctionner après 30 jours. | P0 | S | 4 | compliance | proposé |\r
| NX-381 | Journal des accès administratifs | Toute consultation par le support est tracée et visible du client. | P1 | S | 4 | compliance | proposé |\r
| NX-382 | Détection des connexions anormales | Alerte sur une connexion depuis un pays ou un appareil inhabituel. | P1 | M | 4 | compliance | proposé |\r
| NX-383 | Révocation immédiate au départ d’un conseiller | Accès coupés et dossiers réaffectés le jour même. | P0 | S | 5 | compliance | proposé |\r
| NX-384 | Protection contre l’injection de consignes | Un document déposé ne peut pas détourner le comportement du copilote. | P0 | M | 5 | compliance | proposé |\r
| NX-385 | Sauvegardes testées par restauration | Une restauration mensuelle est vérifiée sur un environnement isolé. | P0 | M | 4 | compliance | proposé |\r
| NX-386 | Test d’intrusion annuel et programme de signalement | Les failles sont trouvées avant les attaquants. | P2 | M | 3 | compliance | proposé |\r
\r
### Observabilité (12)\r
\r
| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |\r
|---|---|---|---|---|---|---|---|\r
| NX-387 | Tableau de santé des connecteurs | Le support voit en temps réel quelle intégration échoue. | P0 | M | 4 | data | proposé |\r
| NX-388 | Traçage de bout en bout des générations | Chaque livrable est relié à son modèle, sa consigne et ses sources. | P1 | M | 4 | data | proposé |\r
| NX-389 | Taux de livrables modifiés ou rejetés | Mesure la qualité réelle de l’IA par type de livrable. | P1 | S | 5 | data | proposé |\r
| NX-390 | Signalement d’erreur factuelle en un clic | Le conseiller marque une erreur qui alimente l’évaluation. | P0 | S | 5 | feature | proposé |\r
| NX-391 | Budget IA par agence avec alertes | Aucune surprise de coût en fin de mois. | P0 | S | 4 | data | proposé |\r
| NX-392 | Page de statut publique | Les agences savent immédiatement si un incident est en cours. | P1 | S | 3 | feature | proposé |\r
| NX-393 | Réconciliation des actions externes | Un message à l’état inconnu est vérifié avant tout renvoi. | P0 | M | 4 | automation | proposé |\r
| NX-394 | Suivi de la latence des générations | Alerte si un livrable met plus de 3 minutes à être produit. | P1 | S | 3 | data | proposé |\r
| NX-395 | Reprise sans doublon après panne | Aucun traitement perdu ni dupliqué après un incident. | P0 | M | 4 | data | proposé |\r
| NX-396 | Retour utilisateur relié à l’écran | Un avis envoyé capture automatiquement le contexte de l’écran. | P1 | S | 3 | ux | proposé |\r
| NX-397 | Mesure d’usage sans traqueur tiers | L’usage est mesuré de façon agrégée, hébergé en UE. | P1 | S | 3 | data | proposé |\r
| NX-398 | Revue hebdomadaire de la qualité IA | Un échantillon de livrables est relu par un humain chaque semaine. | P1 | S | 4 | data | proposé |\r
\r
## 3. Les 100 routines\r
\r
Autonomie : **A** agit seule dans un cadre validé · **V** prépare et attend validation · **P** propose seulement. Chaque routine porte déclencheur, conditions, action, critère de succès et règle d’arrêt ou de repli ; fenêtres calmes, déduplication, journal et budget s’appliquent à toutes.\r
\r
### 3.1 Les 60 routines existantes (résumé)\r
\r
| ID | Famille | Routine | Déclencheur | Autonomie | Phase |\r
|---|---|---|---|---|---|\r
| AUT-001 | Acquisition | Réception d’un lead | Webhook formulaire ou import CRM | A | P0 |\r
| AUT-002 | Acquisition | Recherche de doublon | Nouvelle entrée de réception | V | P0 |\r
| AUT-003 | Acquisition | Affectation au bon secteur | Lead validé | A | P0 |\r
| AUT-004 | Acquisition | Prise en charge tardive | Délai configurable dépassé | A | P0 |\r
| AUT-005 | Acquisition | Permission de contact | Action externe proposée | A | P0 |\r
| AUT-006 | Acquisition | Demande de RDV entrant | Créneau choisi par prospect | P | P1 |\r
| AUT-007 | Acquisition | Qualification incomplète | Lead traité sans critères essentiels | V | P0 |\r
| AUT-008 | Acquisition | Campagne locale de prospection | Campagne agence approuvée | V | P2 |\r
| AUT-009 | Acquisition | Réactivation de projet dormant | Échéance choisie avec le contact | V | P1 |\r
| AUT-010 | Préparation | Préparer le dossier avant RDV | RDV créé à plus de 24 heures | A | P0 |\r
| AUT-011 | Préparation | RDV imminent | RDV créé à moins de 24 heures | A | P0 |\r
| AUT-012 | Préparation | Brief relationnel D1 | Lancement préparation | A | P0 |\r
| AUT-013 | Préparation | Analyse marché D2 | Adresse validée | A | P0 |\r
| AUT-014 | Préparation | Radar quartier D3 | Préparation ou source actualisée | A | P1 |\r
| AUT-015 | Préparation | Contrôle H-2 | Échéance avant RDV | A | P0 |\r
| AUT-016 | Préparation | Rendez-vous déplacé | Modification horaire validée | A | P0 |\r
| AUT-017 | Préparation | Rendez-vous annulé | Annulation explicite | A | P0 |\r
| AUT-018 | Préparation | Coaching D4 volontaire | Agent choisit une simulation | A | P1 |\r
| AUT-019 | Terrain | Dictée de découverte | Action volontaire de l’agent | V | P0 |\r
| AUT-020 | Terrain | Capture photo du bien | Photo ajoutée au dossier | A | P1 |\r
| AUT-021 | Terrain | Complétude avant clôture | Agent termine RDV | A | P0 |\r
| AUT-022 | Terrain | Conflit de données terrain | Nouvelle surface ou prix saisi | V | P0 |\r
| AUT-023 | Terrain | Reprise mobile hors connexion | Connexion rétablie | V | P1 |\r
| AUT-024 | Terrain | Préparation post-RDV | Découverte validée | A | P0 |\r
| AUT-025 | Livrables | L1 remerciement vendeur | Découverte validée | V | P0 |\r
| AUT-026 | Livrables | L2 synthèse équipe | Dossier post-RDV prêt | V | P0 |\r
| AUT-027 | Livrables | L3 avant-première acquéreur | Bien partageable et liste validée | V | P1 |\r
| AUT-028 | Livrables | L4 kit réseaux sociaux | Bien et médias validés | V | P1 |\r
| AUT-029 | Livrables | L5 courrier voisinage | Campagne locale autorisée | V | P2 |\r
| AUT-030 | Livrables | L6 présentation des services | Besoin vendeur confirmé | V | P0 |\r
| AUT-031 | Livrables | L7 estimation argumentée | Comparables et découverte disponibles | V | P0 |\r
| AUT-032 | Livrables | L8 projection visuelle | Photo et demande de staging approuvées | V | P2 |\r
| AUT-033 | Livrables | L9 dossier copro diagnostics | Nature du bien et pièces connues | V | P0 |\r
| AUT-034 | Mandat | Préparer un mandat | Accord commercial confirmé | V | P1 |\r
| AUT-035 | Mandat | Suivre la signature | Webhook prestataire signature | A | P1 |\r
| AUT-036 | Mandat | Rappel échéance mandat | Date configurable avant expiration | A | P1 |\r
| AUT-037 | Mandat | Publication multiportail | Annonce explicitement validée | V | P2 |\r
| AUT-038 | Mandat | Modification du prix | Décision vendeur enregistrée | V | P1 |\r
| AUT-039 | Mandat | Bilan hebdomadaire vendeur | Cadence convenue atteinte | V | P1 |\r
| AUT-040 | Transaction | Planifier visite acquéreur | Créneau choisi | P | P1 |\r
| AUT-041 | Transaction | Retour de visite | Visite marquée tenue | V | P1 |\r
| AUT-042 | Transaction | Offre reçue | Document offre ajouté | V | P1 |\r
| AUT-043 | Transaction | Échéance condition suspensive | Date approche | V | P1 |\r
| AUT-044 | Transaction | Transmission au notaire | Jalon de dossier atteint | V | P1 |\r
| AUT-045 | Transaction | Suivi après acte | Acte confirmé | V | P2 |\r
| AUT-046 | Réseau | Brief agent du matin | 07:30 jour ouvré local | A | P0 |\r
| AUT-047 | Réseau | Revue quotidienne agence | 08:00 jour ouvré local | A | P0 |\r
| AUT-048 | Réseau | Revue pipeline hebdomadaire | Début de semaine agence | A | P1 |\r
| AUT-049 | Réseau | Revue adoption mensuelle | Fin de mois | A | P1 |\r
| AUT-050 | Réseau | Version de modèle réseau | Modèle prêt à déployer | V | P1 |\r
| AUT-051 | Réseau | Réaffectation lors d’absence | Absence ou départ déclaré | V | P0 |\r
| AUT-052 | Exploitation | Santé des connecteurs | Échec ou contrôle périodique | A | P0 |\r
| AUT-053 | Exploitation | Nouveau millésime data | Publication source confirmée | A | P1 |\r
| AUT-054 | Exploitation | Document proche expiration | Échéance calculée selon type | A | P0 |\r
| AUT-055 | Exploitation | Retrait de permission | Opposition enregistrée | A | P0 |\r
| AUT-056 | Exploitation | Demande de droits données | Demande reçue | V | P0 |\r
| AUT-057 | Exploitation | Alerte budget IA | Seuil défini atteint | A | P0 |\r
| AUT-058 | Exploitation | Contrôle qualité livrables | Sortie générée | A | P0 |\r
| AUT-059 | Exploitation | Réconciliation action externe | État de livraison inconnu | A | P0 |\r
| AUT-060 | Exploitation | Sauvegarde et exercice restauration | Cadence exploitation définie | A | P0 |\r
\r
### 3.2 Les 40 nouvelles routines (détail)\r
\r
Répartition : Conformité 10, Marketing 8, Relation client 9, Transaction 4, Mandat 1, Terrain 2, Préparation 1, Réseau 2, Exploitation 2, Livrables 1.\r
\r
#### AUT-061 · Contrôle du consentement avant appel — Conformité · A · P0\r
\r
- **Déclencheur** : Clic sur « Appeler » depuis une fiche contact\r
- **Conditions** : Consentement valide de moins de 12 mois pour ce professionnel ; lun.–ven. 10:00–13:00 ou 14:00–20:00 ; moins de 4 appels sur 30 jours glissants\r
- **Action** : Autoriser l’appel et journaliser la preuve ; sinon griser le bouton et afficher le motif exact\r
- **Succès** : Aucun appel passé hors du cadre légal\r
- **Arrêt / repli** : Proposer courrier ou email consenti ; arrêt définitif si opposition enregistrée\r
\r
#### AUT-062 · Renouvellement de consentement J-30 — Conformité · V · P0\r
\r
- **Déclencheur** : Contrôle quotidien 06:00 : consentement expirant dans 30 jours\r
- **Conditions** : Contact avec projet ouvert et non opposé\r
- **Action** : Préparer une demande de renouvellement par le canal d’origine, à valider par le conseiller\r
- **Succès** : Consentement renouvelé ou contact basculé en canal courrier\r
- **Arrêt / repli** : Une seule demande ; aucune relance après refus ou silence de 15 jours\r
\r
#### AUT-063 · Retrait de consentement immédiat — Conformité · A · P0\r
\r
- **Déclencheur** : Mot-clé STOP reçu, lien de désinscription ou « stop » oral saisi\r
- **Conditions** : Aucune\r
- **Action** : Révoquer les canaux concernés, annuler les envois planifiés et propager la liste d’opposition réseau sous 5 minutes\r
- **Succès** : Zéro sollicitation après le retrait\r
- **Arrêt / repli** : Si un envoi est déjà chez le prestataire, tenter l’annulation et tracer l’échec pour le DPO\r
\r
#### AUT-064 · Contrôle des mentions avant diffusion — Conformité · A · P0\r
\r
- **Déclencheur** : Export d’une annonce, d’un post, d’une lettre ou d’un book citant un prix\r
- **Conditions** : Bien sous mandat\r
- **Action** : Vérifier honoraires TTC en %, charge des honoraires, classes DPE/GES, mention F/G, carte professionnelle ; bloquer si manquant\r
- **Succès** : 100 % des supports diffusés comportent les mentions obligatoires\r
- **Arrêt / repli** : Blocage avec liste des champs à compléter ; aucune diffusion partielle\r
\r
#### AUT-065 · Étiquetage AI Act des images — Conformité · A · P0\r
\r
- **Déclencheur** : Image générée ou modifiée par IA validée pour diffusion\r
- **Conditions** : Image destinée à un support externe\r
- **Action** : Incruster l’étiquette « Image virtuelle », ajouter métadonnées C2PA/IPTC, lier l’original, journaliser modèle et consigne\r
- **Succès** : Aucune image virtuelle publiée sans étiquette ni original\r
- **Arrêt / repli** : Diffusion bloquée si le marquage échoue ; alerte au conseiller\r
\r
#### AUT-066 · Vigilance LCB-FT avant compromis — Conformité · V · P1\r
\r
- **Déclencheur** : Offre acceptée enregistrée\r
- **Conditions** : Montant supérieur au seuil agence, paiement depuis l’étranger, société écran ou PPE détectée\r
- **Action** : Ouvrir la fiche de vigilance, demander identité et origine des fonds, interroger les listes de gels d’avoirs et PPE\r
- **Succès** : Fiche complète et signée avant la date de compromis\r
- **Arrêt / repli** : Escalade au responsable conformité ; jalon compromis bloqué tant qu’un risque élevé n’est pas levé\r
\r
#### AUT-067 · Purge des prospects inactifs — Conformité · V · P0\r
\r
- **Déclencheur** : Mensuel, 1er du mois 03:00\r
- **Conditions** : Aucun contact ni projet depuis 36 mois et aucune obligation légale de conservation\r
- **Action** : Présenter la liste au responsable puis anonymiser les fiches validées\r
- **Succès** : Base alignée sur les durées de conservation\r
- **Arrêt / repli** : Report de 30 jours sur contestation ; dossiers en litige exclus\r
\r
#### AUT-068 · Inscription au registre des mandats — Conformité · A · P1\r
\r
- **Déclencheur** : Mandat signé reçu du prestataire de signature\r
- **Conditions** : Toutes les signatures requises vérifiées\r
- **Action** : Attribuer le numéro d’ordre suivant et sceller l’entrée horodatée\r
- **Succès** : Numérotation continue, sans trou ni doublon\r
- **Arrêt / repli** : Signature incomplète : aucune réservation de numéro, tâche au conseiller\r
\r
#### AUT-069 · Filtrage des oppositions avant routage — Conformité · A · P1\r
\r
- **Déclencheur** : Campagne courrier validée, avant envoi au routeur\r
- **Conditions** : Liste d’adresses calculée\r
- **Action** : Retirer adresses en opposition réseau et contacts ayant refusé, afficher le nombre retiré et le coût final\r
- **Succès** : Aucun courrier adressé à un opposant\r
- **Arrêt / repli** : Routage bloqué si la liste d’opposition date de plus de 24 h\r
\r
#### AUT-070 · Annonce « assistant IA » — Conformité · A · P0\r
\r
- **Déclencheur** : Ouverture d’une conversation avec un agent IA (chat, WhatsApp, voix)\r
- **Conditions** : Aucune\r
- **Action** : Se présenter comme assistant IA dès le premier message et proposer un humain à tout moment\r
- **Succès** : 100 % des conversations IA identifiées comme telles\r
- **Arrêt / repli** : Si le canal ne permet pas la mention, l’agent n’est pas activé sur ce canal\r
\r
#### AUT-071 · Kit social nouveau mandat — Marketing · V · P1\r
\r
- **Déclencheur** : Mandat activé et médias validés par le vendeur\r
- **Conditions** : Diffusion autorisée au mandat ; pas d’option discrétion\r
- **Action** : Préparer 3 posts et 1 story, planifier mardi et jeudi 18:30\r
- **Succès** : Publication sous 48 h après activation\r
- **Arrêt / repli** : Aucun post si le vendeur demande la discrétion ; report si mentions bloquantes\r
\r
#### AUT-072 · Lettre « Vendu dans votre rue » — Marketing · V · P1\r
\r
- **Déclencheur** : Acte authentique confirmé\r
- **Conditions** : Accord vendeur et acquéreur sur la mention ; adresse non identifiante\r
- **Action** : Préparer une lettre « Aux occupants » pour les 150 adresses les plus proches avec aperçu du coût\r
- **Succès** : Campagne validée sous 7 jours\r
- **Arrêt / repli** : Annulée si refus de confidentialité ; oppositions exclues\r
\r
#### AUT-073 · Baisse de prix coordonnée — Marketing · V · P1\r
\r
- **Déclencheur** : Avenant de prix signé\r
- **Conditions** : Mandat actif\r
- **Action** : Mettre à jour portails, mini-site et kit social, puis alerter les acquéreurs compatibles\r
- **Succès** : Prix identique sur tous les supports sous 2 h\r
- **Arrêt / repli** : Si un portail refuse la mise à jour, tâche manuelle et alerte ; pas de publication partielle des alertes\r
\r
#### AUT-074 · Passage sous compromis — Marketing · V · P1\r
\r
- **Déclencheur** : Compromis signé\r
- **Conditions** : Supports actifs\r
- **Action** : Bandeau « sous compromis », suspension de la publicité payante, post facultatif\r
- **Succès** : Aucune dépense publicitaire après le compromis\r
- **Arrêt / repli** : Portail injoignable : tâche manuelle ; réactivation si rétractation\r
\r
#### AUT-075 · Annonce sans contact depuis 10 jours — Marketing · P · P1\r
\r
- **Déclencheur** : Contrôle quotidien 07:00\r
- **Conditions** : Annonce en ligne depuis 10 jours, zéro contact, statistiques portails connectées\r
- **Action** : Diagnostic photos, titre, prix vs comparables et proposition de 3 corrections\r
- **Succès** : Nouveaux contacts sous 7 jours\r
- **Arrêt / repli** : Jamais de baisse de prix automatique ; une proposition par période de 14 jours\r
\r
#### AUT-076 · Note de marché au nouveau millésime DVF — Marketing · V · P2\r
\r
- **Déclencheur** : Import d’un nouveau millésime DVF (avril ou octobre)\r
- **Conditions** : Secteurs de l’agence définis\r
- **Action** : Générer note de quartier, post et mise à jour de page locale\r
- **Succès** : Contenu publié sous 10 jours\r
- **Arrêt / repli** : Aucun chiffre publié si l’échantillon compte moins de 10 ventes\r
\r
#### AUT-077 · Campagne « Votre DPE a peut-être changé » — Marketing · V · P2\r
\r
- **Déclencheur** : Simulation DPE 2026 favorable sur un secteur\r
- **Conditions** : Adresses non opposées ; information RGPD et QR d’opposition prêts\r
- **Action** : Proposer une lettre pédagogique avec simulation générique et invitation à un avis de valeur\r
- **Succès** : Taux de prise de RDV mesuré par campagne\r
- **Arrêt / repli** : Une campagne par secteur et par semestre ; arrêt si opposition\r
\r
#### AUT-078 · Réponse à un avis Google — Marketing · V · P1\r
\r
- **Déclencheur** : Nouvel avis reçu (webhook Google Business)\r
- **Conditions** : Fiche agence connectée\r
- **Action** : Proposer une réponse personnalisée sous 24 h ; alerter le manager si la note est inférieure ou égale à 2\r
- **Succès** : 100 % des avis répondus sous 48 h\r
- **Arrêt / repli** : Aucune publication sans validation humaine\r
\r
#### AUT-079 · Mandat sans visite depuis 14 jours — Relation client · P · P1\r
\r
- **Déclencheur** : Contrôle quotidien 07:15\r
- **Conditions** : Mandat actif, aucune visite tenue depuis 14 jours, hors congés du vendeur\r
- **Action** : Préparer un diagnostic prix, exposition et qualité d’annonce et proposer un point vendeur\r
- **Succès** : Point vendeur tenu sous 7 jours\r
- **Arrêt / repli** : Pas de baisse de prix automatique ; seuil configurable selon typologie et saison\r
\r
#### AUT-080 · Anniversaire d’achat — Relation client · V · P2\r
\r
- **Déclencheur** : Date anniversaire de l’acte (1, 3, 5 ans) à 09:00\r
- **Conditions** : Consentement de communication valide, client non opposé\r
- **Action** : Préparer une note sur l’évolution du quartier avec offre d’avis de valeur\r
- **Succès** : Taux de réponse et avis de valeur demandés\r
- **Arrêt / repli** : Un envoi par an maximum ; arrêt définitif sur opposition\r
\r
#### AUT-081 · Requalification acquéreur à 60 jours — Relation client · A · P1\r
\r
- **Déclencheur** : 60 jours sans activité sur un projet acquéreur\r
- **Conditions** : Projet actif, consentement valide, modèle de message pré-validé par l’agence\r
- **Action** : Envoyer « votre projet a-t-il changé ? » avec boutons confirmer, modifier, suspendre\r
- **Succès** : Projet confirmé, mis à jour ou suspendu\r
- **Arrêt / repli** : Deux relances maximum à 7 jours d’intervalle, puis suspension automatique\r
\r
#### AUT-082 · Alerte nouvelle opportunité — Relation client · V · P1\r
\r
- **Déclencheur** : Nouveau bien ou baisse de prix enregistrée\r
- **Conditions** : Score ≥ 80, acquéreur non sollicité depuis 72 h, bien autorisé à la présentation\r
- **Action** : Proposer un envoi groupé au conseiller avec explication du score\r
- **Succès** : Envoi sous 2 h\r
- **Arrêt / repli** : Maximum 3 alertes par semaine et par acquéreur\r
\r
#### AUT-083 · Satisfaction après estimation — Relation client · A · P2\r
\r
- **Déclencheur** : L7 remis depuis 3 jours\r
- **Conditions** : Vendeur non signataire, consentement email\r
- **Action** : Envoyer un questionnaire de 2 questions sur la clarté de l’estimation\r
- **Succès** : Taux de réponse ≥ 30 %\r
- **Arrêt / repli** : Un seul envoi ; note ≤ 6 crée une tâche manager\r
\r
#### AUT-084 · Parrainage client satisfait — Relation client · V · P2\r
\r
- **Déclencheur** : 90 jours après l’acte, 10:00\r
- **Conditions** : Satisfaction déclarée ≥ 8/10, consentement, aucun litige\r
- **Action** : Proposer une invitation au parrainage personnalisée\r
- **Succès** : Recommandations reçues par dossier clôturé\r
- **Arrêt / repli** : Pas d’envoi si litige ou note inférieure à 8 ; une seule sollicitation\r
\r
#### AUT-085 · Point mensuel vendeur non résident — Relation client · V · P2\r
\r
- **Déclencheur** : 1er lundi du mois, 09:00 heure locale du vendeur\r
- **Conditions** : Vendeur résidant à l’étranger avec mandat actif\r
- **Action** : Proposer un créneau visio et préparer le rapport dans sa langue\r
- **Succès** : Point tenu chaque mois\r
- **Arrêt / repli** : Arrêt à la signature du compromis ou sur demande\r
\r
#### AUT-086 · Silence vendeur 10 jours — Relation client · P · P1\r
\r
- **Déclencheur** : Aucun échange depuis 10 jours ouvrés\r
- **Conditions** : Mandat actif\r
- **Action** : Créer une tâche d’appel avec 3 sujets factuels à aborder\r
- **Succès** : Contact établi sous 3 jours\r
- **Arrêt / repli** : Pas de message automatique au vendeur ; tâche supprimée si échange enregistré\r
\r
#### AUT-087 · Pièce demandée non déposée — Relation client · A · P0\r
\r
- **Déclencheur** : Lien de dépôt envoyé, aucun dépôt à J+3\r
- **Conditions** : Pièce toujours requise et non marquée non applicable\r
- **Action** : Relance douce à J+3, puis tâche d’appel au conseiller à J+7\r
- **Succès** : Pièce reçue sous 10 jours\r
- **Arrêt / repli** : Deux relances maximum ; arrêt dès dépôt ou statut non applicable\r
\r
#### AUT-088 · Délai de rétractation SRU — Transaction · A · P1\r
\r
- **Déclencheur** : Accusé de notification du compromis reçu\r
- **Conditions** : Acquéreur non professionnel\r
- **Action** : Calculer la fin du délai de 10 jours et prévenir vendeur et notaire le lendemain\r
- **Succès** : Fin du délai connue et partagée\r
- **Arrêt / repli** : Date de notification inconnue : demande au notaire, aucun calcul supposé\r
\r
#### AUT-089 · Délai du droit de préemption — Transaction · A · P1\r
\r
- **Déclencheur** : DIA envoyée\r
- **Conditions** : Bien situé en zone de préemption\r
- **Action** : Suivre le délai de 2 mois et rappeler J-15 au conseiller et au notaire\r
- **Succès** : Purge confirmée avant la date d’acte\r
- **Arrêt / repli** : Décision de préemption : alerte immédiate et gel des jalons\r
\r
#### AUT-090 · Financement qui glisse — Transaction · V · P1\r
\r
- **Déclencheur** : Date limite d’obtention du prêt à J-10 sans attestation\r
- **Conditions** : Condition suspensive de prêt active\r
- **Action** : Alerter conseiller et courtier, préparer une demande de prorogation\r
- **Succès** : Attestation reçue ou prorogation signée avant l’échéance\r
- **Arrêt / repli** : Escalade au manager à J-3 ; jamais d’engagement envoyé sans validation\r
\r
#### AUT-091 · Demande de pré-état daté — Transaction · V · P1\r
\r
- **Déclencheur** : Compromis prévu dans moins de 30 jours\r
- **Conditions** : Bien en copropriété, pré-état daté absent\r
- **Action** : Préparer la demande au syndic avec les références du lot\r
- **Succès** : Pré-état daté reçu avant J-7\r
- **Arrêt / repli** : Relance à J+7 puis tâche d’appel ; arrêt dès réception\r
\r
#### AUT-092 · Passage du mandat simple à l’exclusif — Mandat · P · P2\r
\r
- **Déclencheur** : Mandat simple actif depuis 21 jours\r
- **Conditions** : Au moins 3 visites et un retour vendeur positif\r
- **Action** : Proposer au conseiller un argumentaire chiffré de passage en exclusivité\r
- **Succès** : Taux de conversion simple → exclusif\r
- **Arrêt / repli** : Une proposition par mandat ; arrêt si le vendeur refuse\r
\r
#### AUT-093 · Mode visite silencieux — Terrain · A · P2\r
\r
- **Déclencheur** : Début d’une visite inscrite à l’agenda\r
- **Conditions** : Application mobile installée\r
- **Action** : Activer le mode confidentialité : notifications masquées, données sensibles floutées\r
- **Succès** : Aucune notification affichée pendant la visite\r
- **Arrêt / repli** : Désactivation manuelle possible ; fin automatique à l’heure de fin + 15 min\r
\r
#### AUT-094 · Téléchargement hors ligne du matin — Terrain · A · P1\r
\r
- **Déclencheur** : Jours ouvrés à 06:30\r
- **Conditions** : RDV du jour planifiés et appareil sur réseau Wi-Fi ou batterie > 30 %\r
- **Action** : Télécharger dossiers, plans, diagnostics et briefs des RDV du jour\r
- **Succès** : Dossiers du jour disponibles hors ligne à 08:00\r
- **Arrêt / repli** : Nouvel essai à 07:30 ; alerte si échec au premier RDV\r
\r
#### AUT-095 · Préparation d’un RDV vendeur en visio — Préparation · A · P2\r
\r
- **Déclencheur** : RDV vendeur créé en visio avec fuseau horaire différent\r
- **Conditions** : Vendeur non résident\r
- **Action** : Convertir les horaires, envoyer le lien et préparer un brief bilingue\r
- **Succès** : Lien et brief prêts à J-1\r
- **Arrêt / repli** : Annulation ou report : retrait des envois planifiés\r
\r
#### AUT-096 · Journée sans rendez-vous — Réseau · P · P1\r
\r
- **Déclencheur** : Agenda vide sur 48 h ouvrées\r
- **Conditions** : Conseiller actif, hors congés\r
- **Action** : Proposer 5 relances consenties prioritaires et une tournée de boîtage\r
- **Succès** : Plan accepté ou ajusté par le conseiller\r
- **Arrêt / repli** : Une proposition par période de 48 h ; aucune interprétation managériale\r
\r
#### AUT-097 · Coaching suggéré par tendance — Réseau · P · P2\r
\r
- **Déclencheur** : Revue hebdomadaire lundi 07:00\r
- **Conditions** : Taux d’exclusivité ou de transformation en baisse sur 8 semaines, échantillon ≥ 10 dossiers\r
- **Action** : Proposer au manager une session de coaching ciblée\r
- **Succès** : Session planifiée sous 14 jours\r
- **Arrêt / repli** : Pas de suggestion si l’échantillon est insuffisant ; visibilité limitée au manager direct\r
\r
#### AUT-098 · Isolement des consignes cachées — Exploitation · A · P0\r
\r
- **Déclencheur** : Document déposé dans un dossier\r
- **Conditions** : Aucune\r
- **Action** : Détecter les instructions cachées ou inhabituelles et isoler le document du contexte IA\r
- **Succès** : Aucune action IA déclenchée par un document\r
- **Arrêt / repli** : Document mis en quarantaine et signalé ; reprise après revue humaine\r
\r
#### AUT-099 · Pause d’urgence des envois — Exploitation · A · P0\r
\r
- **Déclencheur** : Taux de rebond > 5 % sur 1 h ou plainte enregistrée\r
- **Conditions** : Aucune\r
- **Action** : Suspendre toutes les routines sortantes de l’agence et alerter l’administrateur\r
- **Succès** : Envois arrêtés en moins d’une minute\r
- **Arrêt / repli** : Reprise manuelle uniquement, routine par routine\r
\r
#### AUT-100 · Invalidation des livrables dépendants — Livrables · V · P0\r
\r
- **Déclencheur** : Champ source modifié : surface, prix, DPE ou honoraires\r
- **Conditions** : Livrable déjà validé utilisant ce champ\r
- **Action** : Marquer périmés uniquement les livrables dépendants et proposer leur régénération\r
- **Succès** : Aucun livrable diffusé avec une donnée périmée\r
- **Arrêt / repli** : Livrable déjà envoyé : tâche de correction au conseiller\r
\r
## 4. Séquencement P0 → P3\r
\r
### P0 — 104 idées, 44 routines\r
\r
**Pilote Antibes (0–3 mois).** Le socle qui prouve la promesse : préparation D1–D3, découverte D5 vocale, livrables L1/L2/L6/L7/L9, file de validation, brief du matin, catalogue de routines avec autonomie A/V/P, garde-fous (consentement, mentions, étiquette AI Act, provenance, cloisonnement, purge) et intégrations minimales (agenda, DVF/ADEME, import CRM). Critère de sortie : délai RDV → suivi validé < 2 h en médiane, ≥ 70 % de livrables validés sans réécriture majeure.\r
\r
Idées phares : NX-005 Simulation de reclassement DPE 2026 ; NX-007 Pack « RDV prêt » envoyé la veille à 18 h ; NX-017 Engagements pris pendant le RDV listés ; NX-026 L1 remerciement prêt dans l’heure ; NX-041 L9 statuts absent, non applicable, expiré ; NX-055 Financement déclaré, vérifié et daté ; NX-114 Bascule de la pige téléphonique vers le courrier ; NX-152 Dépôt de pièces par lien ciblé ; NX-186 Mandats proches d’expiration ; NX-205 Niveaux d’autonomie A / V / P visibles.\r
\r
### P1 — 170 idées, 41 routines\r
\r
**Extension agence (3–9 mois).** Tout le cycle commercial : acquéreurs et matching expliqué, visites et retours, offres et pipeline jusqu’à l’acte, portail vendeur, kit social et courrier voisinage, mobile hors ligne, coaching D4, pilotage agence (entonnoir, prévision, qualité), LCB-FT, surcouche CRM bidirectionnelle. Critère : 3 à 5 agences actives chaque semaine, taux d’exclusivité suivi et en hausse.\r
\r
Idées phares : NX-060 Alerte nouvelle opportunité sous 10 minutes ; NX-076 Bon de visite signé électroniquement ; NX-078 Compte rendu de visite vocal en 60 secondes ; NX-079 Retour vendeur anonymisé et validé ; NX-086 Synthèse des objections récurrentes ; NX-090 Registre des offres horodaté ; NX-095 Conditions suspensives avec compte à rebours ; NX-097 Check-list avant signature du compromis ; NX-103 Transactions en danger ; NX-184 Délai RDV → suivi validé, médiane et p90.\r
\r
### P2 — 104 idées, 15 routines\r
\r
**Réseau (9–18 mois).** Gouvernance et échelle : console hiérarchique, routines et gabarits hérités, comparaisons contextualisées, API/MCP, multidiffusion et portails luxe internationaux, routage postal, commissions inter-agences, facturation électronique, SSO/SCIM. Critère : premier réseau multi-agences signé.\r
\r
Idées phares : NX-366 Offre réseau avec console et SSO ; NX-176 Coaching manager suggéré par les tendances ; NX-326 Bailleur vendeur signalé au transactionnaire ; NX-327 Alerte logements interdits à la location ; NX-330 Travaux votés et appels de fonds ; NX-058 Apprentissage des motifs de refus ; NX-080 Visite à distance guidée en direct ; NX-087 Vérification d’identité pour biens prestige ; NX-099 Suivi du prêt avec le courtier invité ; NX-119 Veille des nouveaux DPE ADEME du secteur.\r
\r
### P3 — 20 idées, 0 routines\r
\r
**Paris d’expansion (18 mois et +).** Options et nouveaux marchés : gestion locative et saisonnière, gardiennage, LiDAR, place de marché de modèles, Monaco et Riviera italienne. À n’engager qu’après rétention prouvée sur P0–P2.\r
\r
Idées phares : NX-130 Partenariats yachting, golf et conciergerie ; NX-324 Numéro d’enregistrement meublé de tourisme ; NX-071 Services d’installation pour acquéreurs étrangers ; NX-147 Test A/B des titres d’annonce ; NX-325 État des lieux numérique ; NX-332 Gardiennage de résidences secondaires ; NX-252 Relevé des pièces par LiDAR ; NX-322 Location saisonnière haut de gamme ; NX-328 Portail propriétaire bailleur ; NX-364 Place de marché de modèles et routines.\r
\r
### Dépendances structurantes\r
\r
1. Modèle de dossier unique et provenance par champ **avant** toute génération (sinon les livrables divergent).\r
2. Registre de consentement et liste d’opposition **avant** toute routine sortante (courrier, email, WhatsApp, appel).\r
3. File de validation et journal d’exécution **avant** de passer une routine de V à A.\r
4. Surcouche CRM ou import fiable **avant** le déploiement réseau ; console réseau **après** preuve sur 3 à 5 agences.\r
5. Étiquetage AI Act et règles anti-tromperie **avant** toute diffusion de visuel L8.\r
`,ae={bench:{label:"Benchmark métier",md:rn},insp:{label:"Direction artistique",md:sn},motion:{label:"Motion & interactions",md:an},ideas:{label:"Idées & automatisations",md:on}},ln=["aw-loam-house.jpg","aw-mejuma.jpg","aw-sobha-privy.jpg","aw-lenval.jpg","aw-lev.jpg","aw-mrc-boca.png","aw-rialto.jpg","drb-elyse-phenomenon.webp","drb-nixtio-luxury.webp","drb-lumios-editorial.webp","drb-nixtio-dashboard.webp","drb-nexusai-dark.webp","drb-onero-crm.webp","drb-palco-crm.webp","drb-eloria-orbix.webp","drb-estateo-outcrowd.webp","drb-minhaj-editorial.webp","drb-serhii-minimal.webp","be-agentic-ai-crm.jpg","be-re-platform.jpg","be-lunare.png","be-blumont.jpg","be-jawhara.jpg","be-propflow.png","be-valuation.png","be-re-investment.png","lb-vestris.webp","lb-chisel.webp","lb-flamingo.webp","ms-luxury-hero.jpg","ms-monolith-hero-stratum.jpg","ms-sky-estate.jpg","ms-agent-wave.jpg","ms-golden-portal.jpg","ms-zenith-realty.jpg","ms-scroll-landing.jpg","ms-interactive-discovery.jpg","ms-space-voyage-preloader.jpg","site-loamhouse.jpeg","site-111w57.jpeg","site-aman.jpeg","site-feau.jpeg","site-barnes.jpeg","site-zingraf.jpeg","site-theagency.jpeg","site-knightfrank.jpeg","site-lenval.jpeg","site-lev.jpeg","site-linear.jpeg","site-attio.jpeg","site-folk.jpeg","site-twenty.jpeg","site-clay.jpeg","site-arc.jpeg","site-vercel.jpeg"],un={aw:"Awwwards",drb:"Dribbble",be:"Behance",lb:"Land-book",ms:"MotionSites",site:"Site de référence"};function fn(){const[u,e]=U.useState("bench"),[n,t]=U.useState(null),r=U.useMemo(()=>u==="shots"?"":d.parse(ae[u].md,{async:!1}),[u]);return b.jsxs("div",{children:[b.jsx(Pe,{kicker:"Recherche · octobre 2026",title:b.jsxs(b.Fragment,{children:["Étude & ",b.jsx("span",{className:"italic text-champagne-300",children:"benchmark"})]}),sub:"Concurrence, direction artistique, motion, 398 idées et 100 routines : le socle de décision du produit. Sources publiques datées ; aucun compte concurrent testé."}),b.jsx(we,{className:"mb-8",children:b.jsx(xe,{id:"etude",value:u,onChange:e,items:[...Object.entries(ae).map(([i,s])=>({id:i,label:s.label}))]})}),b.jsx(Y,{mode:"wait",children:b.jsx(V.div,{initial:{opacity:0,y:14},animate:{opacity:1,y:0},exit:{opacity:0},transition:{duration:.5,ease:ee},children:u==="shots"?b.jsx("div",{className:"columns-1 gap-4 sm:columns-2 xl:columns-3",children:ln.map(i=>b.jsxs("button",{onClick:()=>t(i),className:"group mb-4 block w-full overflow-hidden rounded-2xl bg-white/[0.02] text-left ring-1 ring-white/[0.06] transition hover:ring-champagne/30",children:[b.jsx("img",{src:`./research/shots/${i}`,alt:i,loading:"lazy",className:"w-full transition-transform duration-700 ease-silk group-hover:scale-[1.03]"}),b.jsxs("div",{className:"flex items-center justify-between px-3.5 py-2.5 text-[11.5px]",children:[b.jsx("span",{className:"text-bone/75",children:i.replace(/^[a-z]+-/,"").replace(/\.\w+$/,"").replace(/-/g," ")}),b.jsx("span",{className:"text-mist",children:un[i.split("-")[0]]})]})]},i))}):b.jsx("article",{className:"prose-nxt mx-auto max-w-[860px] rounded-[1.6rem] bg-ink-800/70 p-6 shadow-bezel ring-1 ring-white/[0.06] md:p-12",dangerouslySetInnerHTML:{__html:r}})},u)}),b.jsx(Y,{children:n&&b.jsxs(V.div,{className:"fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-6 backdrop-blur",initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},onClick:()=>t(null),children:[b.jsx("button",{"aria-label":"Fermer",className:"absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-bone",children:b.jsx(Se,{size:16})}),b.jsx(V.img,{initial:{scale:.95},animate:{scale:1},transition:{duration:.5,ease:ee},src:`./research/shots/${n}`,alt:"",className:"max-h-full max-w-full rounded-2xl"})]})})]})}export{fn as default};
