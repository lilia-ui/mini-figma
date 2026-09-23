export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Bounds extends Point, Size {}

export interface Viewport extends Point {
  zoom: number
}

export type ShapeType = 'rectangle' | 'ellipse'

export type Tool = 'select' | ShapeType

export interface Shape extends Bounds {
  id: string
  name: string
  type: ShapeType
  fill: string
}

