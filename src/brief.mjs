export function composeBrief(fields,services){
 const value=k=>String(fields[k]||'').replace(/\r/g,'').trim();
 const company=value('company').replace(/\n/g,' ');
 const name=services[value('service')]||'Нужна помощь с выбором решения';
 const lines=['Здравствуйте, Apollo! Хочу обсудить проект.','', 'Задача: '+name];
 if(company)lines.push('Компания / направление: '+company);
 if(value('website'))lines.push('Текущий сайт: '+value('website'));
 lines.push('','Что нужно решить:',value('task')||'Обсудим на встрече.','', 'Бюджет: '+(value('budget')||'Нужна оценка'));
 if(value('timing'))lines.push('Ориентир по запуску: '+value('timing'));
 return {subject:'Проект для Apollo'+(company?' — '+company:''),body:lines.join('\n')};
}
export function mailHref(email,subject,body){
 return 'mailto:'+email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
}

