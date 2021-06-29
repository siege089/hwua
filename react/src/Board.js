import {useEffect, useState} from "react";
import Tile from "./Tile";

const Board = () => {
    const [moves, setMoves] = useState([])
    const [player, setPlayer] = useState('X')
    const [winningPos, setWinningPos] = useState([])

    const getPlayerAtPos = (index) => {
        if (index < 0 || index > 50 * 50)
            return undefined
        const clicked = moves.find(move => move.index === index)
        return clicked === undefined ? undefined : clicked.player
    }

    const getWinningPos = (index) => {
        return winningPos.find(pos => pos === index)
    }

    useEffect(() => {
        if (moves.length > 0) {
            const lastMove = moves[moves.length - 1]
            find5Row(lastMove)
            find5Col(lastMove)
            find5DiagRight(lastMove)
            find5DiagLeft(lastMove)
        }
    }, [moves])

    const find5Row = ({index, player}) => {
        const startIndex = index - 4
        const endIndex = index + 4

        let newWinningPos = []
        for (let currIndex = startIndex; currIndex <= endIndex; currIndex++) {
            if (getPlayerAtPos(currIndex) === player)
                newWinningPos.push(currIndex)
            else
                newWinningPos = []
            if (newWinningPos.length === 5)
                setWinningPos(newWinningPos)
        }
    }

    const find5Col = ({index, player}) => {
        const startIndex = index - (4 * 50)
        const endIndex = index + (4 * 50)

        let newWinningPos = []
        for (let currIndex = startIndex; currIndex <= endIndex; currIndex += 50) {
            if (getPlayerAtPos(currIndex) === player)
                newWinningPos.push(currIndex)
            else
                newWinningPos = []
            if (newWinningPos.length === 5)
                setWinningPos(newWinningPos)
        }
    }

    const find5DiagRight = ({index, player}) => {
        const startIndex = index - (4 * 50) - 4
        const endIndex = index + (4 * 50) + 4

        let newWinningPos = []
        for (let currIndex = startIndex; currIndex <= endIndex; currIndex += 51) {
            if (getPlayerAtPos(currIndex) === player)
                newWinningPos.push(currIndex)
            else
                newWinningPos = []
            if (newWinningPos.length === 5)
                setWinningPos(newWinningPos)
        }
    }

    const find5DiagLeft = ({index, player}) => {
        const startIndex = index - (4 * 50) + 4
        const endIndex = index + (4 * 50) - 4

        let newWinningPos = []
        for (let currIndex = startIndex; currIndex <= endIndex; currIndex += 49) {
            if (getPlayerAtPos(currIndex) === player)
                newWinningPos.push(currIndex)
            else
                newWinningPos = []
            if (newWinningPos.length === 5)
                setWinningPos(newWinningPos)
        }
    }

    const selectTile = (index) => {
        setMoves(moves => [...moves, {index, player}])
        setPlayer(player === 'X' ? 'O' : 'X')
    }

    const getTiles = () => {
        let content = []
        for (let i = 0; i < 50 * 50; i++) {
            content.push(<Tile key={i} index={i} play={winningPos.length === 0 ? selectTile : () => {
            }} player={getPlayerAtPos(i)} winning={getWinningPos(i)}/>)
        }
        return content
    }

    return <>
        <button onClick={() => {
            setMoves([])
            setPlayer('X')
            setWinningPos([])
        }}>Clear
        </button>
        <div className={'board'}>{getTiles()}</div>
    </>
}

export default Board