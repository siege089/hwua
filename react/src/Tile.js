const Tile = ({index, play, player, winning}) => {
    const getClassNames = () => {
        let classNames = ['tile']
        if(player === undefined) {
            classNames.push('tile-selectable')
        } else {
            classNames.push(player === 'X' ? 'green' : 'blue')
        }

        if(winning !== undefined)
            classNames.push('winning')
        return classNames
    }
    return <div className={getClassNames().join(' ')} onClick={() => play(index)}>{player}</div>
}

export default Tile