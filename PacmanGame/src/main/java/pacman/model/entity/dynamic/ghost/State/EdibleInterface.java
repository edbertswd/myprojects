package pacman.model.entity.dynamic.ghost.State;

import pacman.model.entity.dynamic.ghost.GhostImpl;
import pacman.model.level.LevelImpl;

public interface EdibleInterface {
    public void collideWithGhost(LevelImpl l, GhostImpl g);
}

