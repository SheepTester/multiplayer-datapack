import { createElement as e, FC, useState } from 'react'
import classNames from 'classnames'

interface Position {
  x: number
  y: number
}

interface Props {
  direction?: 'both' | 'vertical' | 'horizontal'
  onResize: (position: Position, done: boolean) => void
}

export const ResizeHandle: FC<Props> = ({ onResize, direction = 'both' }: Props) => {
  const [pointerId, setPointerId] = useState<number | null>(null)
  const [mousePos, setMousePos] = useState<Position | null>(null)
  const pointerEnd = (e: PointerEvent) => {
    if (pointerId === e.pointerId) {
      if (mousePos !== null) {
        onResize(mousePos, true)
      }
      setPointerId(null)
      setMousePos(null)
    }
  }
  return e(
    'div',
    {
      className: classNames(
        'resize-handle-wrapper',
        pointerId !== null && 'resizing',
      ),
      onPointerDown (e: PointerEvent) {
        if (pointerId === null) {
          setPointerId(e.pointerId)
          if (e.target instanceof HTMLElement) {
            e.target.setPointerCapture(e.pointerId)
          }
          const position = { x: e.clientX, y: e.clientY }
          onResize(position, false)
          setMousePos(position)
        }
      },
      onPointerMove (e: PointerEvent) {
        if (pointerId === e.pointerId) {
          const position = { x: e.clientX, y: e.clientY }
          onResize(position, false)
          setMousePos(position)
        }
      },
      onPointerUp: pointerEnd,
      onPointerCancel: pointerEnd,
    },
    e(
      'div',
      {
        className: 'resize-handle',
        style: mousePos && {
          position: 'fixed',
          left: direction !== 'vertical' && mousePos.x + 'px',
          top: direction !== 'horizontal' && mousePos.y + 'px',
        },
      }
    ),
  )
}
