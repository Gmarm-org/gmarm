import React from 'react';

export interface AdminStat {
  label: string;
  value: number | string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
  description?: string;
}

interface AdminStatsProps {
  stats: AdminStat[];
  columns?: 2 | 3 | 4 | 5 | 6;
}

const AdminStats: React.FC<AdminStatsProps> = ({ stats, columns = 4 }) => {
  const getGridCols = () => {
    switch (columns) {
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-3';
      case 4: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      case 5: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5';
      case 6: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6';
      default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    }
  };

  const getColorClasses = (color: AdminStat['color']) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'green':
        return 'bg-green-500 hover:bg-green-600';
      case 'purple':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'orange':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'red':
        return 'bg-red-500 hover:bg-red-600';
      case 'gray':
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  return (
    <div className={`grid ${getGridCols()} gap-4 mb-6`}>
      {stats.map((stat, index) => (
        <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-600">{stat.label}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              {stat.description && (
                <div className="text-xs text-gray-500 mt-1">{stat.description}</div>
              )}
            </div>
            <div className={`p-3 rounded-full ${getColorClasses(stat.color)}`}>
              <span className="text-2xl text-white">{stat.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStats;
