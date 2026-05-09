import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Iniciando seed...")

  // Limpiar datos existentes
  await prisma.pointLog.deleteMany()
  await prisma.submission.deleteMany()
  await prisma.challenge.deleteMany()
  await prisma.team.deleteMany()
  await prisma.phase.deleteMany()
  await prisma.siteConfig.deleteMany()

  // Fases
  const fase1 = await prisma.phase.create({
    data: {
      name: "Fase 1: Calentamiento",
      order: 1,
      description: "Puzzles independientes para calentar motores. Cada desafío es autónomo.",
    },
  })

  const fase2 = await prisma.phase.create({
    data: {
      name: "Fase 2: Puzzles conectados",
      order: 2,
      description: "Los puzzles guardan pistas entre sí. Resolver uno desvela información para el siguiente.",
    },
  })

  console.log("✅ Fases creadas")

  // Equipos
  const equipoAlfa = await prisma.team.create({
    data: { name: "Equipo Alfa", secret_code: "ALFA-2024" },
  })
  const equipoDelta = await prisma.team.create({
    data: { name: "Equipo Delta", secret_code: "DELTA-9X" },
  })
  const equipoOmega = await prisma.team.create({
    data: { name: "Equipo Omega", secret_code: "OMEGA-42" },
  })
  const equipoSigma = await prisma.team.create({
    data: { name: "Equipo Sigma", secret_code: "SIGMA-77" },
  })

  console.log("✅ Equipos creados")

  // Desafíos
  const desafioActivo = await prisma.challenge.create({
    data: {
      phase_id: fase1.id,
      title: "El enigma del faro",
      description: `# El enigma del faro

Un marinero dejó este mensaje cifrado antes de desaparecer. El faro lleva años apagado, pero alguien lo encendió esta noche.

**Mensaje encontrado:**
> 13-5-14-19-1-10-5 · 5-14 · 5-12 · 6-1-18-15

Descifra el mensaje y envía la respuesta.

*Pista disponible en 30 minutos...*`,
      media_urls: [],
      end_time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 horas desde ahora
      status: "active",
      challenge_type: "single",
      hint_text: "Los números corresponden a posiciones en el alfabeto (A=1, B=2...)",
      hint_available_at: new Date(Date.now() + 30 * 60 * 1000), // 30 min desde ahora
    },
  })

  const desafioDraft = await prisma.challenge.create({
    data: {
      phase_id: fase1.id,
      title: "La cámara de los espejos",
      description: `# La cámara de los espejos

Cuatro espejos, cuatro reflexiones, una sola verdad.

¿Cuántos triángulos hay en la siguiente figura?

[imagen de figura geométrica compleja]`,
      media_urls: [{ type: "image", url: "/challenges/espejos.png", alt: "Figura geométrica" }],
      end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 semana desde ahora
      status: "draft",
      challenge_type: "double",
    },
  })

  console.log("✅ Desafíos creados")

  // Submissions de prueba
  const sub1 = await prisma.submission.create({
    data: {
      team_id: equipoAlfa.id,
      challenge_id: desafioActivo.id,
      answer: "MENSAJE EN EL FARO",
      is_valid: true,
      created_at: new Date(Date.now() - 5 * 60 * 1000), // hace 5 min
    },
  })

  await prisma.submission.create({
    data: {
      team_id: equipoDelta.id,
      challenge_id: desafioActivo.id,
      answer: "mensaje en el faro",
      is_valid: true,
      created_at: new Date(Date.now() - 3 * 60 * 1000), // hace 3 min
    },
  })

  await prisma.submission.create({
    data: {
      team_id: equipoOmega.id,
      challenge_id: desafioActivo.id,
      answer: "faro mensaje",
      is_valid: false,
      created_at: new Date(Date.now() - 1 * 60 * 1000), // hace 1 min
    },
  })

  console.log("✅ Submissions creadas")

  // PointLogs de prueba (Alfa ganó, Delta segundo)
  await prisma.pointLog.create({
    data: {
      team_id: equipoAlfa.id,
      challenge_id: desafioActivo.id,
      points: 1,
      reason: "1er lugar — El enigma del faro",
    },
  })

  await prisma.pointLog.create({
    data: {
      team_id: equipoDelta.id,
      challenge_id: desafioActivo.id,
      points: 1,
      reason: "2do lugar — El enigma del faro",
    },
  })

  // Punto de bonus manual
  await prisma.pointLog.create({
    data: {
      team_id: equipoAlfa.id,
      challenge_id: null,
      points: 1,
      reason: "Bonus — mejor presentación de respuesta",
    },
  })

  console.log("✅ PointLogs creados")

  // SiteConfig
  await prisma.siteConfig.create({
    data: { key: "ranking_visible", value: "true" },
  })

  console.log("✅ SiteConfig creada")
  console.log("")
  console.log("🎉 Seed completado.")
  console.log(`   Fases: 2  |  Equipos: 4  |  Desafíos: 2  |  Submissions: 3  |  PointLogs: 3`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
