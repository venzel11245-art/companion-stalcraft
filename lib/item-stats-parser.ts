// lib/item-stats-parser.ts

const STAT_KEY_MAP: Record<string, string> = {
  // --- Оружие: базовые статы ---
  'core.tooltip.stat_name.damage_type.direct': 'damage',
  'weapon.tooltip.weapon.info.damage_distant': 'minDamage',
  'weapon.tooltip.weapon.info.rate_of_fire': 'fireRate',
  'weapon.tooltip.weapon.info.spread': 'spread',
  'weapon.tooltip.weapon.info.hip_spread': 'hipSpread',
  'weapon.tooltip.weapon.info.recoil': 'verticalRecoil',
  'weapon.tooltip.weapon.info.clip_size': 'magazineSize',
  'weapon.tooltip.weapon.info.distance': 'maxDistance',
  'weapon.tooltip.magazine.info.reload_time': 'reloadTime',
  
  // --- Оружие: статы модификации (заточки) ---
  'weapon.stat_factor.damage': 'damagePercent',
  'weapon.stat_factor.recoil_gain': 'recoilGainPercent',

  // --- Общее для всех предметов ---
  'core.tooltip.info.weight': 'weight',
  'core.tooltip.info.max_durability': 'maxDurability',
  'core.tooltip.info.capacity': 'capacity',
  'stalker.artefact_properties.factor.speed_modifier': 'speedModifier',
  
  // --- Броня и Артефакты: ВСЕ типы защиты и выживаемости ---
  'stalker.artefact_properties.factor.bullet_dmg_factor': 'bulletProof',
  'stalker.artefact_properties.factor.tear_dmg_factor': 'tearProof',
  'stalker.artefact_properties.factor.explosion_dmg_factor': 'explosionProof',
  'stalker.artefact_properties.factor.electra_dmg_factor': 'electraProof',
  'stalker.artefact_properties.factor.burn_dmg_factor': 'burnProof',
  'stalker.artefact_properties.factor.chemical_burn_dmg_factor': 'chemicalBurnProof',
  'stalker.artefact_properties.factor.radiation_protection': 'radiationProof',
  'stalker.artefact_properties.factor.thermal_protection': 'thermalProof',
  'stalker.artefact_properties.factor.biological_protection': 'biologicalProof',
  'stalker.artefact_properties.factor.psycho_protection': 'psychoProof',
  'stalker.artefact_properties.factor.bleeding_protection': 'bleedingProof',
  'stalker.artefact_properties.factor.max_weight_bonus': 'maxWeightBonus',
  'stalker.artefact_properties.factor.stamina_bonus': 'staminaBonus',
  'stalker.artefact_properties.factor.stopping_protection': 'stoppingProof',
}

function deepExtract(node: any, target: Record<string, any>) {
  if (!node) return
  
  if (Array.isArray(node)) {
    for (const item of node) deepExtract(item, target)
    return
  }
  
  if (node.type === 'numeric' && node.name?.key && STAT_KEY_MAP[node.name.key]) {
    const statName = STAT_KEY_MAP[node.name.key]
    const value = node.value !== undefined ? node.value : (node.min !== undefined ? node.min : null)
    if (value !== null) {
      target[statName] = value
    }
  }
  
  if (node.elements) deepExtract(node.elements, target)
  if (node.compact) deepExtract(node.compact, target)
  if (node.detailed) deepExtract(node.detailed, target)
}

export function parseItemStats(item: any) {
  const stats: Record<string, any> = {}
  const upgradeStats: Record<string, any> = {}

  if (!item.infoBlocks) return { baseStats: stats, upgradeStats }

  for (const block of item.infoBlocks) {
    if (block.type === 'damage') {
      stats.startDamage = block.startDamage
      stats.endDamage = block.endDamage
    } else if (block.type === 'list') {
      const titleKey = block.title?.key
      if (titleKey === 'weapon.tooltip.weapon.info.upgrade_stats') {
        deepExtract(block.elements, upgradeStats)
      } else {
        deepExtract(block.elements, stats)
      }
    } else if (block.type === 'grouped') {
      deepExtract(block.compact, stats)
      deepExtract(block.detailed, stats)
    }
  }

  return { baseStats: stats, upgradeStats }
}