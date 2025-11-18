"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatsChart from "./StatsChart";
import { cn } from "@/lib/utils";

interface StatChartSectionProps {
  type: 'users' | 'documents' | 'shares';
  title: string;
  initialPeriod?: 'day' | 'week' | 'month' | 'year';
  className?: string;
}

export default function StatChartSection({ 
  type, 
  title, 
  initialPeriod = 'week',
  className 
}: StatChartSectionProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>(initialPeriod);
  const [chartData, setChartData] = useState<Array<{ date: string; count: number }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/stats?type=${type}&period=${period}`);
        const data = await response.json();
        if (data.success && data.data) {
          setChartData(data.data);
        }
      } catch (error) {
        console.error(`❌ Erreur récupération données ${type}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, period]);

  // Fonction réutilisable pour traiter les données de période
  const processPeriodData = (
    data: Array<{ date: string; count: number }>,
    periodType: 'day' | 'week' | 'month' | 'year'
  ): Array<{ name: string; value: number; date: string }> => {
    // Créer un map des données existantes avec les dates de l'API
    const dataMap = new Map<string, number>();
    if (data && data.length > 0) {
      data.forEach((item) => {
        dataMap.set(item.date, item.count);
      });
    }

    // Pour semaine, générer toutes les 4 semaines et compléter avec 0
    if (periodType === 'week') {
      const periods: Array<{ name: string; value: number; date: string }> = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Calculer le lundi de la semaine actuelle (compatible avec PostgreSQL DATE_TRUNC('week'))
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const currentWeekMonday = new Date(today);
      currentWeekMonday.setDate(today.getDate() - daysToMonday);
      currentWeekMonday.setHours(0, 0, 0, 0);
      
      const formatDate = (d: Date) => {
        const day = d.getDate();
        const month = d.getMonth() + 1;
        return `${day}/${month}`;
      };
      
      // Générer les 4 dernières semaines
      for (let i = 3; i >= 0; i--) {
        const weekMonday = new Date(currentWeekMonday);
        weekMonday.setDate(currentWeekMonday.getDate() - (i * 7));
        
        const weekEnd = new Date(weekMonday);
        weekEnd.setDate(weekMonday.getDate() + 6);
        
        // Format de date pour correspondre à PostgreSQL (YYYY-MM-DD)
        const dateStr = weekMonday.toISOString().split('T')[0];
        
        // Chercher dans dataMap avec la date exacte
        let value = dataMap.get(dateStr) || 0;
        
        // Si pas trouvé, essayer de normaliser les dates de l'API et comparer
        if (value === 0 && dataMap.size > 0) {
          for (const [apiDate, apiCount] of dataMap.entries()) {
            const apiDateNormalized = new Date(apiDate + 'T00:00:00').toISOString().split('T')[0];
            if (apiDateNormalized === dateStr) {
              value = apiCount;
              break;
            }
          }
        }
        
        periods.push({
          name: `${formatDate(weekMonday)}-${formatDate(weekEnd)}`,
          value: value,
          date: dateStr,
        });
      }
      
      return periods;
    }

    // Pour jour, mois et année, générer toutes les périodes et compléter avec 0
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const periods: Array<{ name: string; value: number; date: string }> = [];
    let count: number;
    let dateFormat: (date: Date) => string;
    let dateLabel: (date: Date) => string;

    switch (periodType) {
      case 'day':
        count = 7;
        dateFormat = (date: Date) => {
          return date.toISOString().split("T")[0];
        };
        dateLabel = (date: Date) => {
          const day = date.getDate();
          const month = date.getMonth() + 1;
          return `${day}/${month}`;
        };
        break;
      case 'month':
        count = 12;
        dateFormat = (date: Date) => {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
        };
        dateLabel = (date: Date) => {
          const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
          return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        };
        break;
      case 'year':
        count = 10;
        dateFormat = (date: Date) => {
          return `${date.getFullYear()}-01-01`;
        };
        dateLabel = (date: Date) => {
          return String(date.getFullYear());
        };
        break;
      default:
        return [];
    }

    // Générer toutes les périodes
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(today);
      
      if (periodType === 'day') {
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
      } else if (periodType === 'month') {
        date.setMonth(date.getMonth() - i);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
      } else if (periodType === 'year') {
        date.setFullYear(date.getFullYear() - i);
        date.setMonth(0);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
      }
      
      const dateStr = dateFormat(date);
      periods.push({
        name: dateLabel(date),
        value: dataMap.get(dateStr) || 0,
        date: dateStr,
      });
    }

    return periods;
  };

  const periodData = processPeriodData(chartData, period);

  const periodLabel = {
    day: 'jour',
    week: 'semaine',
    month: 'mois',
    year: 'année',
  }[period];

  const typeLabel = {
    users: 'utilisateurs',
    documents: 'documents',
    shares: 'notes partagées',
  }[type];

  return (
    <Card className={cn("bg-background", className)}>
      <Card.Header>
        <div className="flex items-center justify-between">
          <Card.Title className="text-foreground text-2xl font-semibold">
            {title}
          </Card.Title>
          <Select value={period} onValueChange={(value) => setPeriod(value as 'day' | 'week' | 'month' | 'year')}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Par jour (7 derniers jours)</SelectItem>
              <SelectItem value="week">Par semaine (4 dernières semaines)</SelectItem>
              <SelectItem value="month">Par mois</SelectItem>
              <SelectItem value="year">Par année</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card.Header>
      <Card.Content>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : periodData.length > 0 ? (
          <StatsChart
            data={periodData}
            type="line"
            dataKey="value"
            title={`Nombre de ${typeLabel} créés par ${periodLabel}`}
          />
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">Aucune donnée disponible</p>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

