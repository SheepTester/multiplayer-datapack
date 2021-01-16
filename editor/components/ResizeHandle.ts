import { createElement as e, FC, useEffect, useRef, useState } from 'react'

interface Props {
  onResize: (x: number) => void
}

export const ResizeHandle: FC<Props> = ({ onResize }: Props) => {
  return e(
    'div',
    {
      className: 'resize-handle',
      onPointerDown (e) {
        //
      },
    }
  )
}
