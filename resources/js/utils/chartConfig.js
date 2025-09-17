import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';

// Enregistrer tous les composants Chart.js nécessaires
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

// Configuration par défaut pour tous les graphiques
export const defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#666',
            borderWidth: 1,
        },
    },
    scales: {
        x: {
            grid: {
                color: '#e5e7eb',
            },
        },
        y: {
            grid: {
                color: '#e5e7eb',
            },
        },
    },
};

// Configuration pour les graphiques en ligne
export const lineChartOptions = {
    ...defaultChartOptions,
    interaction: {
        mode: 'index',
        intersect: false,
    },
    plugins: {
        ...defaultChartOptions.plugins,
        filler: {
            propagate: true,
        },
    },
};

// Configuration pour les graphiques en barres
export const barChartOptions = {
    ...defaultChartOptions,
    plugins: {
        ...defaultChartOptions.plugins,
    },
};

// Configuration pour les graphiques en camembert/donut
export const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#666',
            borderWidth: 1,
        },
    },
};

// Palette de couleurs par défaut
export const colorPalette = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#ec4899', // pink
    '#6b7280', // gray
];

// Fonction utilitaire pour générer des couleurs
export const generateColors = (count, opacity = 1) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const baseColor = colorPalette[i % colorPalette.length];
        if (opacity < 1) {
            // Convertir hex en rgba
            const hex = baseColor.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            colors.push(`rgba(${r}, ${g}, ${b}, ${opacity})`);
        } else {
            colors.push(baseColor);
        }
    }
    return colors;
};

export default ChartJS;