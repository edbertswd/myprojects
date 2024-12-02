package pacman.model.entity.dynamic.ghost.State;

import pacman.model.entity.dynamic.ghost.GhostImpl;
import pacman.model.entity.dynamic.player.Pacman;
import pacman.model.level.LevelImpl;

public class NormalState implements EdibleInterface {

    @Override
    public void collideWithGhost(LevelImpl l, GhostImpl g){
        l.handleLoseLife(); //Lose Player Life
    }

}

