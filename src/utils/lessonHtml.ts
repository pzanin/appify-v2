import type {SubModule} from '../types';
import {generateBuilderHtml} from './builderHtml';
// Regenerate only visual Builder output. Imported and authored HTML stays intact.
export function lessonHtml(lesson:SubModule,language:string) {
  if(lesson.htmlMode==='visual' && !lesson.customHtml && lesson.builder_data?.length) return generateBuilderHtml(lesson.builder_data,language);
  return lesson.customHtml || lesson.contentHtml || lesson.content_html || '';
}
