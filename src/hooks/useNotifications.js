import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function sendCollisionAlert(satelliteName, debrisName, timeToApproach, probability) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚨 ALERTA VERMELHO — RISCO DE COLISÃO',
      body: `${satelliteName} em rota de colisão com ${debrisName}\nTCA: ${timeToApproach} | Prob: ${probability}%`,
      sound: true,
      priority: 'max',
      color: '#FF2D2D',
      data: { type: 'collision_alert', satelliteName, debrisName },
    },
    trigger: null, // imediato
  });
}

export async function sendManeuverConfirmation(satelliteName, maneuverType) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ Manobra Evasiva Confirmada',
      body: `${satelliteName}: ${maneuverType} programada com sucesso.`,
      sound: true,
      color: '#00FF94',
      data: { type: 'maneuver_confirmed', satelliteName },
    },
    trigger: null,
  });
}

export async function sendConjunctionWarning(sat1, sat2, missDistance) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚠️ Conjunção Detectada',
      body: `${sat1} e ${sat2} a ${missDistance} km de distância mínima.`,
      color: '#FFB800',
      data: { type: 'conjunction', sat1, sat2 },
    },
    trigger: null,
  });
}

export function useNotificationListener(onNotification) {
  const listenerRef = useRef(null);
  useEffect(() => {
    listenerRef.current = Notifications.addNotificationReceivedListener(onNotification);
    return () => {
      if (listenerRef.current) Notifications.removeNotificationSubscription(listenerRef.current);
    };
  }, [onNotification]);
}
