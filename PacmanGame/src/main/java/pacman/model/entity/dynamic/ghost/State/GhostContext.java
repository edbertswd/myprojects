package pacman.model.entity.dynamic.ghost.State;

import pacman.model.entity.dynamic.ghost.GhostImpl;
import pacman.model.entity.dynamic.player.Pacman;
import pacman.model.level.LevelImpl;

public class GhostContext implements EdibleInterface {
    private EdibleInterface state;
	private LevelImpl levelImpl;

    public void setState(EdibleInterface state) {
		this.state = state;
	}

	public EdibleInterface getState() {
		return this.state;
	}

	@Override
    public void collideWithGhost(LevelImpl l, GhostImpl g){
		this.state.collideWithGhost(l, g);
    }

}
