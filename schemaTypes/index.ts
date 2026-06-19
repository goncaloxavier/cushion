import {siteLanding} from './siteLanding'
import {blogPost} from './blogPost'
import {caseStudy} from './caseStudy'
import {contentCard} from './objects/contentCard'
import {impactStat} from './objects/impactStat'
import {localizedArticle} from './objects/localizedArticle'
import {localizedString} from './objects/localizedString'
import {localizedText} from './objects/localizedText'
import {partnerItem} from './objects/partnerItem'
import {productCategory} from './productCategory'

export const schemaTypes = [
  siteLanding,
  productCategory,
  caseStudy,
  blogPost,
  localizedArticle,
  localizedString,
  localizedText,
  partnerItem,
  contentCard,
  impactStat,
]
