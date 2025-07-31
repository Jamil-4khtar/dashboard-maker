// src/lib/constants.js
import { Type, BarChart3, Table } from 'lucide-react';
import TextWidget from '../widgets/TextWidget/TextWidget';
import ChartWidget from '../widgets/ChartWidget/ChartWidget';
import TableWidget from '../widgets/TableWidget/TableWidget';


export const WIDGET_TYPES = {
  text: {
    name: 'Text',
    icon: Type,
    component: TextWidget,
    defaultConfig: { text: 'Double-click to edit', fontSize: 16 }
  },
  chart: {
    name: 'Chart',
    icon: BarChart3,
    component: ChartWidget,
    defaultConfig: {
      type: 'bar',
      data: [
        { label: 'Jan', value: 65 },
        { label: 'Feb', value: 78 },
        { label: 'Mar', value: 92 }
      ]
    }
  },
  table: {
    name: 'Table',
    icon: Table,
    component: TableWidget,
    defaultConfig: {
      data: [
        { name: 'John', age: 30, city: 'New York' },
        { name: 'Jane', age: 25, city: 'Boston' },
        { name: 'Bob', age: 35, city: 'Chicago' }
      ]
    }
  }
};