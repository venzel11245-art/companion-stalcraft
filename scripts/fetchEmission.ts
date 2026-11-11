import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0NzE0IiwianRpIjoiOTk1YTBiNzQxYTU2YTc1MmQxODFkY2QzNjY2Mzk0YTJlMjQ3OWFiYWYyMzAyMjI3ZTBjMjBhMTMwYjlhN2RmYTQxNmUyMDQxM2ViOGJjNTciLCJpYXQiOjE3OTI3MTM4ODQuNTM2MTYzLCJuYmYiOjE3OTI3MTM4ODQuNTM2MTY2LCJleHAiOjE4MjQyNDk4ODQuMjYxMDAzLCJzdWIiOiIzNzkxMjE2Iiwic2NvcGVzIjpbXX0.Ly5_Qy8T-QDcvTqUo0B-flN358jztty_-IV8jss0eZdqmIK8Tgrq63jTjlMgFugfipkmizKkkCaXOwSv9KCclavF0_Av97dBRfur-lMWugYBsYE-6rXkgzQzlC2UtgQZppDTTPD_j--7gBYmMWcgrpT3r3Zf8QX0-RybTh3LN8MG4nWFcMiSJOEyI7276fJErfKDvfjGWb-9EVTEAZxblhTEdC6IiyaV3Mk14g4Sz_zUjsGeTkyWGEMGWVNKp-y2riCriFQfaHdIoKH9HnMRPxdfSN7uJXwf3tsU-ysz58m95r0mKTnn5Wa4KtZmFNSY5q3Hi4kvgr3nPl-JRim9KyzWlRAHwKI_FG0TnYp1MtxPp2qdP1jHXpIu3dr0aiTtJBuWU8evB2-DKrbJUhEEOf2ITZMSkl6eIf8llJeuP5Ko3ZVGmRmTio6cmzuI33PUsqZEaCeihrob4rQOCwred0DlU_VE715S5_hjKrJKOZO0HWrn-EbDD1TPzCmSNCgYa7O968gM2LTONUw_sCYL-J1FmkzgeSqGMLcD_s7ulpr-Dm4HlTnirPyBbowJbWknETJr5cEdRKItkPvkMD46P8VklQqUevKY24qfBM58oo1SSyxqLZ_jv5QGkO9hMsRfUoTpR9g46ZPEkItV7WIzzo1h8r3gUJH_PTBEa6ExhRo'

async function fetchEmission() {
  console.log('🔍 Получаем данные о выбросе...')
  
  const res = await fetch('https://eapi.stalzone.com/RU/emission', {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Accept': 'application/json',
    },
  })
  
  if (!res.ok) {
    console.error('❌ Ошибка:', res.status)
    return
  }
  
  const data = await res.json()
  console.log('✅ Данные получены:', data)
  
  // Рассчитываем следующий выброс (примерно каждые 2 часа)
  const previousEnd = new Date(data.previousEnd)
  const nextPredicted = new Date(previousEnd.getTime() + 2 * 60 * 60 * 1000)
  
  console.log('📅 Предыдущий выброс начался:', data.previousStart)
  console.log(' Предыдущий выброс закончился:', data.previousEnd)
  console.log('⏰ Следующий выброс прогнозируется:', nextPredicted.toISOString())
  
  // Сохраняем в базу
  await prisma.emissionTimer.upsert({
    where: { id: 1 },
    update: {
      previousStart: new Date(data.previousStart),
      previousEnd: new Date(data.previousEnd),
      nextPredicted: nextPredicted,
      lastUpdated: new Date(),
    },
    create: {
      region: 'RU',
      previousStart: new Date(data.previousStart),
      previousEnd: new Date(data.previousEnd),
      nextPredicted: nextPredicted,
      lastUpdated: new Date(),
    },
  })
  
  console.log('💾 Данные сохранены в базу!')
}

fetchEmission()
  .catch(console.error)
  .finally(() => prisma.$disconnect())