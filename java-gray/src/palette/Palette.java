package palette;

import java.awt.BorderLayout;
import java.awt.Button;
import java.awt.Color;
import java.awt.Container;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Image;
import java.awt.MenuBar;
import java.awt.ScrollPane;
import java.awt.Toolkit;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.image.BufferedImage;
import java.beans.Visibility;
import java.io.File;
import java.io.IOException;

import javax.imageio.ImageIO;
import javax.management.loading.PrivateClassLoader;
import javax.swing.*;

public class Palette {
 private JFrame frame;
 private JScrollPane ScrollPane;
 private JPanel panel;
 private Container content;
 private JToolBar toolbar;
 private JMenuItem openItem;
 private JButton ScaleButton, GrayButton;
 private File file;
 private BufferedImage image;
 private BufferedImage destImage;
 public Palette(){
  frame = new JFrame();
  frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
  content = frame.getContentPane();
  JMenuBar menubar = new JMenuBar();
  frame.setJMenuBar(menubar);
  frame.setLayout(null);
  panel = new JPanel();
  ScrollPane = new JScrollPane();
  ScrollPane.setBounds(100, 100, 800, 500);
  frame.add(ScrollPane);
  JMenu menu = new JMenu("File");
  menubar.add(menu);
  openItem = new JMenuItem("Open");
  menu.add(openItem);
  GrayButton = new JButton("灰度级别");
  GrayButton.setBounds(0, 10, 100, 40);
  frame.add(GrayButton);
  bindEvent();
  
  frame.setBounds(200, 0, 1000, 800);
  
  frame.setVisible(true);
 }
 
 private void bindEvent() {
	 openItem.addActionListener(new ActionListener() {  
		  @Override
		  public void actionPerformed(ActionEvent arg0) {
			  JFileChooser fileChooser = new JFileChooser();
			   
			   int n = fileChooser.showOpenDialog(fileChooser);
			   if (n == fileChooser.APPROVE_OPTION){
			    
			   }
			   panel.removeAll();
			   panel.setBounds(0, 0, 200, 200);
			   panel.add(new JLabel(new ImageIcon(fileChooser.getSelectedFile().getPath())));
			   file = new File(fileChooser.getSelectedFile().getPath());  
			   try {
				   image = ImageIO.read(file);
			   } catch (IOException e) {
				// TODO Auto-generated catch block
				   e.printStackTrace();
			   }  
			      
			   ScrollPane.setViewportView(panel);  
			   frame.setVisible(true);
			   
		  }
	  });
	 GrayButton.addActionListener(new ActionListener() {
		
		@Override
		public void actionPerformed(ActionEvent e) {
			Object[] obj2 ={ "2", "256" };  
			String s = (String) JOptionPane.showInputDialog(null,"请选择灰度级别:\n", "爱好", JOptionPane.PLAIN_MESSAGE, null, obj2, "2"); 
			int width = image.getWidth();  
		    int height = image.getHeight();  
		    if (s.equals('2')) {
		    	destImage = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_BINARY);
		    } else {
		    	destImage = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
		    }
		    for(int i= 0 ; i < width ; i++){  
		        for(int j = 0 ; j < height; j++){  
		        int rgb = image.getRGB(i, j);  
		        destImage.setRGB(i, j, rgb);  
		        }  
		    }
		    JFrame another = new JFrame("目标图");
		    Image myImage = (Image)destImage;
		    another.setBounds(50, 50, width, height);
		    another.setContentPane(new XPanel(myImage));
		    another.setVisible(true);
		}
	});
	 
 }
 
 public static void main(String[] args) {
  new Palette();
 }
}

class XPanel extends JPanel {
    private Image image;
    public XPanel(Image image){
        this.image = image;
        setOpaque(false);
    }

    @Override public void paintComponent(Graphics g){
        g.setColor(Color.BLACK);
        g.fillRect(0,0,getWidth(),getHeight());
        g.drawImage(image, 0, 0, this);
    }
}