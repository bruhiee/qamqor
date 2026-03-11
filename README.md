# Qamqor Health Platform

Веб-платформа для AI-поддержки первичной медицинской оценки (triage), медицинской осведомлённости и инструментов управления здоровьем.

## Что уже есть в проекте

- Frontend на React + TypeScript (`src/`)
- Backend API на Node.js (`server/index.js`)
- Локальное JSON-хранилище (`server/data/db.json`)
- Базовые страницы: AI-консультант, аптечка, карта, статьи, форум, symptom tracker, админ-панель

## Концепция и спецификация

Подробная продуктовая спецификация находится в файле:

- [docs/PRODUCT_SPEC.md](/C:/Users/nurzh/OneDrive/Документы/serverProjectARSEN/docs/PRODUCT_SPEC.md)

## Основные роли

- `user`: доступ к пользовательским функциям платформы
- `doctor`: ответы на форуме, клиническая валидация сложных случаев
- `admin`: модерация, верификация, управление системой и анонимной аналитикой

## Ключевые направления MVP

- AI Triage Consultant с оценкой риска 1-5
- Symptom Tracker с динамикой по времени
- Medicine Cabinet с контролем сроков годности и напоминаниями
- Медицинский форум с модерацией
- Карта медучреждений

## Следующий шаг разработки

Ориентироваться на раздел `MVP (Phase 1)` и `Технический roadmap` в [docs/PRODUCT_SPEC.md](/C:/Users/nurzh/OneDrive/Документы/serverProjectARSEN/docs/PRODUCT_SPEC.md).
